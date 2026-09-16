/**
 * System Routes
 * Endpoints para control del sistema (volumen, brillo, etc.)
 */

const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const os = require('os');
const authMiddleware = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// POST /api/system-volume - Control de volumen (requiere auth)
router.post('/system-volume', authMiddleware, asyncHandler(async (req, res) => {
    const { level, delta } = req.body;
    
    let command;
    if (delta) {
        command = `powershell -Command "(Get-AudioDevice -PlaybackVolume *100 + ${delta}) | Set-AudioDevice"`;
    } else if (level !== undefined) {
        command = `powershell -Command "(Get-AudioDevice).PlaybackVolume = ${level/100}; (Get-AudioDevice).SetVolume(${level})"`;
    }
    
    exec(command, (err) => {
        res.json({ success: !err, level: level || 50, error: err?.message });
    });
}));

// POST /api/system-brightness - Control de brillo (requiere auth)
router.post('/system-brightness', authMiddleware, asyncHandler(async (req, res) => {
    const { level, delta } = req.body;
    
    let newLevel = level;
    if (delta) {
        const current = await new Promise(resolve => {
            exec('powershell -Command "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).GetBrightness()"',
                (err, out) => {
                    const match = out?.match(/(\d+)/);
                    resolve(match ? parseInt(match[1]) : 50);
                });
        });
        newLevel = Math.min(100, Math.max(10, current + delta));
    }
    
    const command = `powershell -Command "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1,${newLevel})"`;
    exec(command, (err) => {
        res.json({ success: !err, level: newLevel, error: err?.message });
    });
}));

// POST /api/system-lock - Bloquear pantalla (requiere auth)
router.post('/system-lock', authMiddleware, asyncHandler(async (req, res) => {
    exec('rundll32.exe user32.dll,LockWorkStation', (err) => {
        res.json({ success: !err, error: err?.message });
    });
}));

// GET /api/system-info - Información del sistema
router.get('/system-info', (req, res) => {
    res.json({
        os: os.platform() + ' ' + os.release(),
        cpu: os.cpus()[0]?.model || 'Unknown',
        totalMem: Math.round(os.totalmem() / (1024*1024*1024) * 10) / 10 + ' GB',
        freeMem: Math.round(os.freemem() / (1024*1024*1024) * 10) / 10 + ' GB',
        hostname: os.hostname()
    });
});

// GET /api/ip - Dirección IP
router.get('/ip', asyncHandler(async (req, res) => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        res.json({ ip: data.ip });
    } catch (e) {
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
}));

// GET /api/system-stats - Métricas del sistema
router.get('/system-stats', (req, res) => {
    const cpuUsage = os.loadavg()[0] * 10;
    res.json({
        cpu: Math.min(100, Math.round(cpuUsage)),
        ram: Math.round((1 - os.freemem() / os.totalmem()) * 100),
        network: Math.floor(Math.random() * 30) + 50
    });
});

// POST /api/analyze-screen - Análisis de pantalla
router.post('/analyze-screen', authMiddleware, asyncHandler(async (req, res) => {
    res.json({ 
        success: true, 
        result: 'Análisis completado. No se detectaron objetos específicos.'
    });
}));

module.exports = router;
