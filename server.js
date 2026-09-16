require('dotenv').config();
const express = require('express');
const compression = require('compression');
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
const aiRoutes = require('./src/routes/ai');

// Validar variables de entorno
if (!validateEnv()) {
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Compresión gzip (reduce tamaño de respuestas ~70%)
app.use(compression({
    threshold: 1024, // Comprimir respuestas mayores a 1KB
    level: 6 // Nivel de compresión balanceado
}));

// Middleware
app.use(express.json());

// Rate limiting
app.use(generalLimiter);

// Cache para archivos estáticos (1 día)
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true,
    lastModified: true
}));

// Cache más largo para assets (CSS, JS, imágenes)
app.use(express.static(__dirname, {
    maxAge: '7d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        // Headers más agresivos para CSS y JS
        if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
            res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        }
    }
}));

// Routes
app.use('/api', chatRoutes);
app.use('/api', commandRoutes);
app.use('/api', systemRoutes);
app.use('/api/ai', aiRoutes);

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
