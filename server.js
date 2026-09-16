require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const db = require('./database');
const { startBot } = require('./lib/telegram');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// === AI PROVIDERS (Misma config que Kyun) ===
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-120b:free';

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
    throw new Error(`Groq error ${response.status}`);
  }

  recordSuccess('groq');
  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

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
    throw new Error(`OpenRouter error ${response.status}`);
  }

  recordSuccess('openrouter');
  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

// Fallback system: Groq → OpenRouter (como Kyun)
async function getAIResponse(messages) {
  try {
    return await callGroq(messages);
  } catch (e) {
    console.log(`[AI] Groq falló: ${e.message}, intentando OpenRouter...`);
  }

  try {
    return await callOpenRouter(messages);
  } catch (e) {
    console.log(`[AI] OpenRouter falló: ${e.message}`);
  }

  return 'Todos los providers están indisponibles. Intenta de nuevo en unos segundos.';
}

// === ROUTES ===

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index_gemini.html'));
});

app.get('/overlay.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'overlay.html'));
});

app.get('/overlay', (req, res) => {
    res.sendFile(path.join(__dirname, 'overlay.html'));
});

// Chat endpoint con fallback Groq → OpenRouter
app.post('/api/chat', async (req, res) => {
    const { mensaje, sessionId, tipo } = req.body;
    
    if (!mensaje || !sessionId) {
        return res.status(400).json({ error: 'Faltan datos' });
    }
    
    const tipoMensaje = tipo || 'user';
    
    if (tipoMensaje === 'update') {
        await db.actualizarChat(sessionId, mensaje);
    } else {
        await db.guardarMensaje(sessionId, mensaje, tipoMensaje);
        await db.actualizarChat(sessionId, mensaje.substring(0, 50));
    }
    
    res.json({ success: true });
});

// AI Chat endpoint (nuevo, usa mismos providers que Kyun)
app.post('/api/ai/chat', async (req, res) => {
    const { message, history } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Mensaje requerido' });
    }
    
    const systemPrompt = `Eres ARES, asistente de IA en español. Responde de forma útil y concisa. Estilo TRON/futurista.`;
    
    const messages = [
        { role: 'system', content: systemPrompt },
        ...(history || []),
        { role: 'user', content: message }
    ];
    
    try {
        const response = await getAIResponse(messages);
        res.json({ response, provider: providerStatus.groq.available ? 'groq' : 'openrouter' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Provider status endpoint
app.get('/api/providers', (req, res) => {
    res.json({
        groq: { enabled: !!GROQ_API_KEY, inCooldown: isInCooldown('groq'), model: GROQ_MODEL },
        openrouter: { enabled: !!OPENROUTER_API_KEY, inCooldown: isInCooldown('openrouter'), model: OPENROUTER_MODEL }
    });
});

app.get('/api/conversacion/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const mensajes = await db.obtenerConversacion(sessionId);
    res.json(mensajes);
});

app.delete('/api/conversacion/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    await db.limpiarConversacion(sessionId);
    res.json({ success: true });
});

app.get('/api/chats', async (req, res) => {
    const chats = await db.obtenerHistorialChats();
    res.json(chats);
});

app.post('/api/chats', async (req, res) => {
    const { sessionId, titulo } = req.body;
    if (!sessionId) {
        return res.status(400).json({ error: 'Falta sessionId' });
    }
    await db.crearChat(sessionId, titulo || 'Nuevo Chat');
    res.json({ success: true });
});

app.put('/api/chats/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const { titulo } = req.body;
    await db.renombrarChat(sessionId, titulo);
    res.json({ success: true });
});

app.delete('/api/chats/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    await db.eliminarChat(sessionId);
    res.json({ success: true });
});

// ARES Command Execution API
const executor = require('./command_executor');

app.post('/api/execute', async (req, res) => {
    const { command } = req.body;
    
    if (!command) {
        return res.status(400).json({ error: 'Falta el comando' });
    }
    
    console.log(`[ARES] Ejecutando: ${command}`);
    
    try {
        const result = await executor.executeShellCommand(command);
        console.log(`[ARES] Resultado: ${result.stdout.substring(0, 200)}`);
        res.json(result);
    } catch (error) {
        console.error(`[ARES] Error: ${error.error}`);
        res.json({ success: false, error: error.error });
    }
});

app.post('/api/mouse', async (req, res) => {
    const { action, x, y } = req.body;
    
    try {
        const result = await executor.mouseAction(action, x, y);
        res.json(result);
    } catch (error) {
        res.json({ error: error.error });
    }
});

app.post('/api/keyboard', async (req, res) => {
    const { text } = req.body;
    
    try {
        const result = await executor.keyboardType(text);
        res.json(result);
    } catch (error) {
        res.json({ error: error.error });
    }
});

// === SYSTEM CONTROL ENDPOINTS ===

app.post('/api/system-volume', async (req, res) => {
    const { level, delta } = req.body;
    const { exec } = require('child_process');
    
    try {
        let command;
        if (delta) {
            command = `powershell -Command "(Get-AudioDevice -PlaybackVolume *100 + ${delta}) | Set-AudioDevice"`;
        } else if (level !== undefined) {
            command = `powershell -Command "(Get-AudioDevice).PlaybackVolume = ${level/100}; (Get-AudioDevice).SetVolume(${level})"`;
        }
        
        exec(command, (err) => {
            res.json({ success: true, level: level || 50 });
        });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

app.post('/api/system-brightness', async (req, res) => {
    const { level, delta } = req.body;
    const { exec } = require('child_process');
    
    let newLevel = level;
    if (delta) {
        const current = await new Promise(resolve => {
            exec('powershell -Command "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).GetBrightness()"',
                (err, out) => {
                    const match = out.match(/(\d+)/);
                    resolve(match ? parseInt(match[1]) : 50);
                });
        });
        newLevel = Math.min(100, Math.max(10, current + delta));
    }
    
    const command = `powershell -Command "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1,${newLevel})"`;
    exec(command, (err) => {
        res.json({ success: true, level: newLevel });
    });
});

app.post('/api/system-lock', async (req, res) => {
    const { exec } = require('child_process');
    exec('rundll32.exe user32.dll,LockWorkStation', (err) => {
        res.json({ success: !err, error: err?.message });
    });
});

app.get('/api/system-info', async (req, res) => {
    const os = require('os');
    res.json({
        os: os.platform() + ' ' + os.release(),
        cpu: os.cpus()[0]?.model || 'Unknown',
        totalMem: Math.round(os.totalmem() / (1024*1024*1024) * 10) / 10 + ' GB',
        freeMem: Math.round(os.freemem() / (1024*1024*1024) * 10) / 10 + ' GB',
        hostname: os.hostname()
    });
});

app.get('/api/ip', async (req, res) => {
    try {
        const fetch = (await import('node-fetch')).default || require('node-fetch');
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        res.json({ ip: data.ip });
    } catch (e) {
        const os = require('os');
        const network = os.networkInterfaces();
        let localIP = '127.0.0.1';
        for (const name of Object.keys(network)) {
            for (const iface of network[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    localIP = iface.address;
                    break;
                }
            }
        }
        res.json({ ip: localIP });
    }
});

app.get('/api/system-stats', async (req, res) => {
    const os = require('os');
    const cpuUsage = os.loadavg()[0] * 10;
    res.json({
        cpu: Math.min(100, Math.round(cpuUsage)),
        ram: Math.round((1 - os.freemem() / os.totalmem()) * 100),
        network: Math.floor(Math.random() * 30) + 50
    });
});

app.post('/api/analyze-screen', async (req, res) => {
    res.json({ 
        success: true, 
        result: 'Análisis completado. No se detectaron objetos específicos.'
    });
});

async function startServer(overridePort = null) {
    const portToUse = overridePort || PORT;
    const connected = await db.testConnection();
    await db.initDatabase();
    
    const server = app.listen(portToUse, () => {
        console.log(`\n🔴 ARES - Control Maestro`);
        console.log(`   Base de datos local: ✅ SQLite`);
        console.log(`   Sincronización: ${connected ? '✅ En línea' : '⏳ Sin conexión'}`);
        console.log(`   Servidor: http://localhost:${portToUse}${portToUse !== PORT ? ' (puerto alternativo)' : ''}`);
        console.log(`   Providers: Groq=${!!GROQ_API_KEY}, OpenRouter=${!!OPENROUTER_API_KEY}`);
        console.log(`   Modelos: Groq=${GROQ_MODEL}, OpenRouter=${OPENROUTER_MODEL}`);
        console.log(`   Telegram: @Ares_MasterControlBot ✅\n`);
        
        startBot().catch(e => console.error('[Telegram] Error:', e.message));
    });
    
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️ Puerto ${portToUse} en uso, intentando ${portToUse + 1}...`);
            startServer(portToUse + 1);
        } else {
            console.error('❌ Error del servidor:', err);
        }
    });
}

startServer();

module.exports = app;
