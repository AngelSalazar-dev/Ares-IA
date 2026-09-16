/**
 * Rate limiting para Ares
 * Previene abusos y ataques DoS
 */

const rateLimit = require('express-rate-limit');

// Límite general: 100 requests por minuto por IP
const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: 'Demasiadas peticiones. Intenta de nuevo en 1 minuto.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Límite para ejecutar comandos: 10 por minuto
const executeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: 'Demasiados comandos ejecutados. Límite: 10/minuto.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Límite para chat IA: 30 por minuto
const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Demasiados mensajes de chat. Límite: 30/minuto.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { generalLimiter, executeLimiter, chatLimiter };
