/**
 * Centralized Error Handler
 * Maneja todos los errores de forma consistente
 */

function errorHandler(err, req, res, next) {
    const timestamp = new Date().toISOString();
    const path = req.path;
    const method = req.method;
    
    console.error(`[ERROR] ${timestamp} ${method} ${path}:`, err.message);
    
    // Si es error de validación
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Datos inválidos',
            details: err.message
        });
    }
    
    // Si es error de autenticación
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'No autorizado'
        });
    }
    
    // Si es timeout
    if (err.code === 'ETIMEDOUT' || err.killed) {
        return res.status(504).json({
            error: 'Timeout - operación tomó demasiado tiempo'
        });
    }
    
    // Error genérico
    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}

// Wrapper para async handlers
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = { errorHandler, asyncHandler };
