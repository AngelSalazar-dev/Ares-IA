/**
 * Middleware de autenticación para Ares
 * Protege endpoints sensibles con API key
 */

function authMiddleware(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.ARES_API_KEY;
    
    // Si no hay API key configurada, permitir (para desarrollo)
    if (!expectedKey) {
        console.warn('[AUTH] ⚠️ No hay ARES_API_KEY configurada. Modo desarrollo.');
        return next();
    }
    
    if (!apiKey) {
        return res.status(401).json({ 
            error: 'API key requerida',
            hint: 'Envía header x-api-key'
        });
    }
    
    if (apiKey !== expectedKey) {
        console.log(`[AUTH] ❌ API key inválida desde ${req.ip}`);
        return res.status(403).json({ error: 'API key inválida' });
    }
    
    next();
}

module.exports = authMiddleware;
