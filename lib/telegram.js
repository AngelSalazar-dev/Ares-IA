/**
 * Telegram Gateway para ARES
 * Misma configuración de APIs y modelos que Kyun
 */

// Cargar variables de entorno
require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

// Modelos (misma configuración que Kyun)
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-120b:free';

// Provider status tracking (como Kyun)
const COOLDOWN_MS = 60_000;
const MAX_FAILS = 2;
const providerStatus = {
  groq: { available: !!GROQ_API_KEY, cooldownUntil: 0, failCount: 0 },
  openrouter: { available: !!OPENROUTER_API_KEY, cooldownUntil: 0, failCount: 0 },
};

function isInCooldown(name) {
  const s = providerStatus[name];
  if (Date.now() < s.cooldownUntil) return true;
  if (s.cooldownUntil > 0) {
    s.cooldownUntil = 0;
    s.failCount = 0;
    s.available = true;
  }
  return false;
}

function recordFailure(name) {
  const s = providerStatus[name];
  s.failCount++;
  if (s.failCount >= MAX_FAILS) {
    s.cooldownUntil = Date.now() + COOLDOWN_MS;
    s.available = false;
  }
}

function recordSuccess(name) {
  providerStatus[name].failCount = 0;
  providerStatus[name].cooldownUntil = 0;
  providerStatus[name].available = true;
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

const ALLOWED_COMMANDS = [
  'npm', 'node', 'npx', 'git', 'python', 'pip', 'code', 'notepad',
  'calc', 'explorer', 'cmd', 'powershell', 'docker', 'start'
];

const APP_MAP = {
  'spotify': 'start spotify',
  'chrome': 'start chrome',
  'firefox': 'start firefox',
  'edge': 'start msedge',
  'calculadora': 'calc',
  'bloc de notas': 'notepad',
  'discord': 'start discord',
  'whatsapp': 'start whatsapp',
  'youtube': 'start https://youtube.com',
  'telegram': 'start telegram'
};

function extractCommand(message) {
  const patterns = [
    /^(ejecuta|abrir|abre|corre|inicia)\s+(.+)$/i,
    /^(pon|poner)\s+(.+)$/i,
    /^(abre)\s+(.+)$/i,
  ];
  
  for (const p of patterns) {
    const match = message.match(p);
    if (match) {
      const name = match[2].toLowerCase().trim();
      
      for (const [key, cmd] of Object.entries(APP_MAP)) {
        if (name.includes(key) || key.includes(name)) {
          return cmd;
        }
      }
      
      if (name.length > 2) {
        return `start "" "${name}"`;
      }
    }
  }
  return null;
}

function isCommandSafe(cmd) {
  const first = cmd.split(' ')[0].toLowerCase();
  if (first === 'start') return true;
  return ALLOWED_COMMANDS.some(a => first === a);
}

async function sendMessage(chatId, text) {
  await fetch(`${API_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  });
}

// Función para llamar a Groq (como Kyun)
async function callGroq(messages) {
  if (!GROQ_API_KEY || isInCooldown('groq')) {
    throw new Error('Groq no disponible');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    recordFailure('groq');
    const error = await response.text();
    throw new Error(`Groq error ${response.status}: ${error}`);
  }

  recordSuccess('groq');
  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

// Función para llamar a OpenRouter (fallback, como Kyun)
async function callOpenRouter(messages) {
  if (!OPENROUTER_API_KEY || isInCooldown('openrouter')) {
    throw new Error('OpenRouter no disponible');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    recordFailure('openrouter');
    const error = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${error}`);
  }

  recordSuccess('openrouter');
  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

// Sistema de fallback como Kyun: Groq → OpenRouter
async function getAIResponse(messages) {
  // Intentar Groq primero
  try {
    return await callGroq(messages);
  } catch (e) {
    console.log(`[Telegram] Groq falló: ${e.message}, intentando OpenRouter...`);
  }

  // Fallback a OpenRouter
  try {
    return await callOpenRouter(messages);
  } catch (e) {
    console.log(`[Telegram] OpenRouter falló: ${e.message}`);
  }

  return 'Todos los providers están indisponibles. Intenta de nuevo en unos segundos.';
}

async function processMessage(chatId, text) {
  const { exec } = require('child_process');
  
  const cmd = extractCommand(text);
  if (cmd && isCommandSafe(cmd)) {
    return new Promise((resolve) => {
      exec(cmd, { timeout: 10000 }, (error, stdout, stderr) => {
        const response = error 
          ? `❌ Error: ${error.message}` 
          : `✅ **Ejecutado:** ${cmd}\n\n${stdout || 'Completado'}`;
        resolve(response);
      });
    });
  }
  
  const systemPrompt = `Eres ARES, asistente de IA en español. Responde de forma útil y concisa.`;
  
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: text }
  ];
  
  return await getAIResponse(messages);
}

async function startBot() {
  console.log('[Telegram] Iniciando gateway...');
  console.log(`[Telegram] Providers: Groq=${!!GROQ_API_KEY}, OpenRouter=${!!OPENROUTER_API_KEY}`);
  console.log(`[Telegram] Modelos: Groq=${GROQ_MODEL}, OpenRouter=${OPENROUTER_MODEL}`);
  
  let offset = 0;
  
  while (true) {
    try {
      const response = await fetch(`${API_URL}/getUpdates?offset=${offset}&timeout=60`);
      const data = await response.json();
      
      if (data.ok && data.result) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          
          if (update.message) {
            const chatId = update.message.chat.id;
            const text = update.message.text;
            
            console.log(`[Telegram] Mensaje: ${text}`);
            
            await fetch(`${API_URL}/sendChatAction`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chatId, action: 'typing' })
            });
            
            const response = await processMessage(chatId, text);
            await sendMessage(chatId, response);
          }
        }
      }
    } catch (e) {
      console.error('[Telegram Error]', e.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

module.exports = { startBot, processMessage };

if (require.main === module) {
  startBot();
}
