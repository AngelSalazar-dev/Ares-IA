/**
 * Environment Variables Validation
 * Verifica que todas las variables requeridas estén definidas
 */

const REQUIRED_VARS = [
    'TELEGRAM_BOT_TOKEN',
    'GROQ_API_KEY',
];

const OPTIONAL_VARS = [
    'OPENROUTER_API_KEY',
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'ARES_API_KEY',
    'PORT',
];

function validateEnv() {
    const missing = REQUIRED_VARS.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error('❌ Variables de entorno faltantes:', missing.join(', '));
        console.error('   Copia .env.example a .env y completa los valores');
        return false;
    }
    
    // Warn about optional missing vars
    const missingOptional = OPTIONAL_VARS.filter(key => !process.env[key]);
    if (missingOptional.length > 0) {
        console.warn('⚠️  Variables opcionales no definidas:', missingOptional.join(', '));
    }
    
    return true;
}

function getEnv(key, defaultValue = undefined) {
    return process.env[key] || defaultValue;
}

module.exports = { validateEnv, getEnv };
