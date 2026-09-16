/**
 * Command Routes
 * Endpoints para ejecución de comandos del sistema
 */

const express = require('express');
const router = express.Router();
const executor = require('../../command_executor');
const authMiddleware = require('../middleware/auth');
const { executeLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');

// POST /api/execute - Ejecutar comando (requiere auth + rate limit)
router.post('/execute', authMiddleware, executeLimiter, asyncHandler(async (req, res) => {
    const { command } = req.body;
    
    if (!command) {
        return res.status(400).json({ error: 'Falta el comando' });
    }
    
    console.log(`[ARES] Ejecutando: ${command}`);
    
    const result = await executor.executeShellCommand(command);
    
    if (result.stdout) {
        console.log(`[ARES] Resultado: ${result.stdout.substring(0, 200)}`);
    }
    
    res.json(result);
}));

// POST /api/mouse - Acción del mouse (requiere auth)
router.post('/mouse', authMiddleware, asyncHandler(async (req, res) => {
    const { action, x, y } = req.body;
    const result = await executor.mouseAction(action, x, y);
    res.json(result);
}));

// POST /api/keyboard - Escritura de teclado (requiere auth)
router.post('/keyboard', authMiddleware, asyncHandler(async (req, res) => {
    const { text } = req.body;
    const result = await executor.keyboardType(text);
    res.json(result);
}));

module.exports = router;
