/**
 * Chat Routes
 * Endpoints para chat con IA y gestión de mensajes
 */

const express = require('express');
const router = express.Router();
const db = require('../../database');
const { getAIResponse, getProviderStatus } = require('../config/providers');
const { chatLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/providers - Estado de providers
router.get('/providers', (req, res) => {
    res.json(getProviderStatus());
});

// POST /api/chat - Guardar mensaje en DB
router.post('/', asyncHandler(async (req, res) => {
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
}));

// POST /api/ai/chat - Chat con IA (con rate limiting)
router.post('/ai/chat', chatLimiter, asyncHandler(async (req, res) => {
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
    
    const response = await getAIResponse(messages);
    const status = getProviderStatus();
    
    res.json({ 
        response, 
        provider: status.groq.enabled && !status.groq.inCooldown ? 'groq' : 'openrouter' 
    });
}));

// GET /api/conversacion/:sessionId - Obtener conversación
router.get('/conversacion/:sessionId', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const mensajes = await db.obtenerConversacion(sessionId);
    res.json(mensajes);
}));

// DELETE /api/conversacion/:sessionId - Limpiar conversación
router.delete('/conversacion/:sessionId', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    await db.limpiarConversacion(sessionId);
    res.json({ success: true });
}));

// GET /api/chats - Obtener historial de chats
router.get('/chats', asyncHandler(async (req, res) => {
    const chats = await db.obtenerHistorialChats();
    res.json(chats);
}));

// POST /api/chats - Crear nuevo chat
router.post('/chats', asyncHandler(async (req, res) => {
    const { sessionId, titulo } = req.body;
    if (!sessionId) {
        return res.status(400).json({ error: 'Falta sessionId' });
    }
    await db.crearChat(sessionId, titulo || 'Nuevo Chat');
    res.json({ success: true });
}));

// PUT /api/chats/:sessionId - Renombrar chat
router.put('/chats/:sessionId', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { titulo } = req.body;
    await db.renombrarChat(sessionId, titulo);
    res.json({ success: true });
}));

// DELETE /api/chats/:sessionId - Eliminar chat
router.delete('/chats/:sessionId', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    await db.eliminarChat(sessionId);
    res.json({ success: true });
}));

module.exports = router;
