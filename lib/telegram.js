/**
 * Telegram Gateway para ARES
 * Permite controlar ARES desde Telegram
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const MODEL = 'llama-3.3-70b-versatile'

const PROVIDERS = [
  {
    name: 'groq',
    apiKey: GROQ_API_KEY,
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    headers: {}
  },
  {
    name: 'gemini',
    apiKey: GEMINI_API_KEY,
    url: 'https://generativelanguage.googleapis.com/v1beta/models/chat:sendMessage',
    model: 'gemini-2.0-flash-lite-001',
    headers: {}
  }
]

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`

const ALLOWED_COMMANDS = [
  'npm', 'node', 'npx', 'git', 'python', 'pip', 'code', 'notepad',
  'calc', 'explorer', 'cmd', 'powershell', 'docker', 'start'
]

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
}

function extractCommand(message) {
  const patterns = [
    /^(ejecuta|abrir|abre|corre|inicia)\s+(.+)$/i,
    /^(pon|poner)\s+(.+)$/i,
    /^(abre)\s+(.+)$/i,
  ]
  
  for (const p of patterns) {
    const match = message.match(p)
    if (match) {
      const name = match[2].toLowerCase().trim()
      
      for (const [key, cmd] of Object.entries(APP_MAP)) {
        if (name.includes(key) || key.includes(name)) {
          return cmd
        }
      }
      
      if (name.length > 2) {
        return `start "" "${name}"`
      }
    }
  }
  return null
}

function isCommandSafe(cmd) {
  const first = cmd.split(' ')[0].toLowerCase()
  if (first === 'start') return true
  return ALLOWED_COMMANDS.some(a => first === a)
}

async function sendMessage(chatId, text) {
  await fetch(`${API_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  })
}

async function processMessage(chatId, text) {
  const { exec } = require('child_process')
  
  const cmd = extractCommand(text)
  if (cmd && isCommandSafe(cmd)) {
    return new Promise((resolve) => {
      exec(cmd, { timeout: 10000 }, (error, stdout, stderr) => {
        const response = error 
          ? `❌ Error: ${error.message}` 
          : `✅ **Ejecutado:** ${cmd}\n\n${stdout || 'Completado'}`
        resolve(response)
      })
    })
  }
  
  const systemPrompt = `Eres ARES, asistente de IA en español. Responde de forma útil y concisa.`
  
  // Intentar con cada proveedor en orden
  for (const provider of PROVIDERS) {
    try {
      let url, body, headers
      
      if (provider.name === 'groq') {
        url = provider.url
        headers = {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        }
        body = JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          max_tokens: 1000
        })
      } else if (provider.name === 'gemini') {
        url = `${provider.url}?key=${provider.apiKey}`
        headers = { 'Content-Type': 'application/json' }
        body = JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'user', parts: [{ text }] }
          ]
        })
      }
      
      const res = await fetch(url, { method: 'POST', headers, body })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.log(`[Telegram] Groq error ${res.status}: ${errorText}`)
        continue // Intentar siguiente proveedor
      }
      
      const data = await res.json()
      let response
      
      if (provider.name === 'groq') {
        response = data.choices?.[0]?.message?.content
      } else if (provider.name === 'gemini') {
        response = data.candidates?.[0]?.content?.parts?.[0]?.text
      }
      
      if (response) {
        return response
      }
    } catch (e) {
      console.log(`[Telegram] ${provider.name} error: ${e.message}`)
      continue // Intentar siguiente proveedor
    }
  }
  
  return 'No tengo respuesta'
}

async function startBot() {
  console.log('[Telegram] Iniciando gateway...')
  
  // Obtener actualizaciones
  let offset = 0
  
  while (true) {
    try {
      const response = await fetch(`${API_URL}/getUpdates?offset=${offset}&timeout=60`)
      const data = await response.json()
      
      if (data.ok && data.result) {
        for (const update of data.result) {
          offset = update.update_id + 1
          
          if (update.message) {
            const chatId = update.message.chat.id
            const text = update.message.text
            
            console.log(`[Telegram] Mensaje: ${text}`)
            
            // Enviar "escribiendo..."
            await fetch(`${API_URL}/sendChatAction`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chatId, action: 'typing' })
            })
            
            // Procesar y responder
            const response = await processMessage(chatId, text)
            await sendMessage(chatId, response)
          }
        }
      }
    } catch (e) {
      console.error('[Telegram Error]', e.message)
      await new Promise(r => setTimeout(r, 5000))
    }
  }
}

// Exportar para uso en servidor
module.exports = { startBot, processMessage }

// Si se ejecuta directamente
if (require.main === module) {
  startBot()
}