require('dotenv').config();
const express = require('express');
const path = require('path');

// Config
const { validateEnv } = require('./src/config/env');
const { getProviderStatus } = require('./src/config/providers');

// Middleware
const { generalLimiter } = require('./src/middleware/rateLimiter');
const { errorHandler } = require('./src/middleware/errorHandler');

// Routes
const chatRoutes = require('./src/routes/chat');
const commandRoutes = require('./src/routes/command');
const systemRoutes = require('./src/routes/system');

// Validar variables de entorno
if (!validateEnv()) {
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(generalLimiter);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Routes
app.use('/api', chatRoutes);
app.use('/api', commandRoutes);
app.use('/api', systemRoutes);

// Pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index_gemini.html'));
});

app.get('/overlay.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'overlay.html'));
});

app.get('/overlay', (req, res) => {
    res.sendFile(path.join(__dirname, 'overlay.html'));
});

// Error handler
app.use(errorHandler);

// Start server
async function startServer(overridePort = null) {
    const db = require('./database');
    const { startBot } = require('./lib/telegram');
    
    const portToUse = overridePort || PORT;
    const connected = await db.testConnection();
    await db.initDatabase();
    
    const server = app.listen(portToUse, () => {
        const status = getProviderStatus();
        
        console.log(`\n🔴 ARES - Control Maestro`);
        console.log(`   Base de datos local: ✅ SQLite`);
        console.log(`   Sincronización: ${connected ? '✅ En línea' : '⏳ Sin conexión'}`);
        console.log(`   Servidor: http://localhost:${portToUse}${portToUse !== PORT ? ' (puerto alternativo)' : ''}`);
        console.log(`   Providers: Groq=${status.groq.enabled}, OpenRouter=${status.openrouter.enabled}`);
        console.log(`   Modelos: Groq=${status.groq.model}, OpenRouter=${status.openrouter.model}`);
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
