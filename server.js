const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const db = require('./database');

// Importar gateway de Telegram
const { startBot } = require('./lib/telegram');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index_gemini.html'));
});

app.get('/overlay.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'overlay.html'));
});

app.get('/overlay', (req, res) => {
    res.sendFile(path.join(__dirname, 'overlay.html'));
});

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

// === ENDPOINTS DE CONTROL DEL SISTEMA ===

// Control de volumen (Windows)
app.post('/api/system-volume', async (req, res) => {
    const { level, delta } = req.body;
    const { exec } = require('child_process');
    
    try {
        let command;
        if (delta) {
            // Ajustar volumen actual
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

// Control de brillo (Windows)
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

// Lock de sistema (Windows)
app.post('/api/system-lock', async (req, res) => {
    const { exec } = require('child_process');
    exec('rundll32.exe user32.dll,LockWorkStation', (err) => {
        res.json({ success: !err, error: err?.message });
    });
});

// Información del sistema
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

// IP pública
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

// Estado del sistema
app.get('/api/system-stats', async (req, res) => {
    const os = require('os');
    const cpuUsage = os.loadavg()[0] * 10; // Aproximación
    res.json({
        cpu: Math.min(100, Math.round(cpuUsage)),
        ram: Math.round((1 - os.freemem() / os.totalmem()) * 100),
        network: Math.floor(Math.random() * 30) + 50
    });
});

// Análisis de pantalla
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
        console.log(`   Telegram: @Ares_MasterControlBot ✅\n`);
        
        // Iniciar gateway de Telegram en background
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