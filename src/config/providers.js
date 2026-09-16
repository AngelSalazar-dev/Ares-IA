/**
 * AI Providers - Groq + OpenRouter con fallback
 * Extraído de server.js para reutilización
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-120b:free';

const COOLDOWN_MS = 60_000;
const MAX_FAILS = 2;

const providerStatus = {
    groq: { available: !!GROQ_API_KEY, cooldownUntil: 0, failCount: 0 },
    openrouter: { available: !!OPENROUTER_API_KEY, cooldownUntil: 0, failCount: 0 },
};

function isInCooldown(name) {
    const s = providerStatus[name];
    if (Date.now() < s.cooldownUntil) return true;
    if (s.cooldownUntil > 0) {
        s.cooldownUntil = 0;
        s.failCount = 0;
        s.available = true;
    }
    return false;
}

function recordFailure(name) {
    const s = providerStatus[name];
    s.failCount++;
    if (s.failCount >= MAX_FAILS) {
        s.cooldownUntil = Date.now() + COOLDOWN_MS;
        s.available = false;
    }
}

function recordSuccess(name) {
    providerStatus[name].failCount = 0;
    providerStatus[name].cooldownUntil = 0;
    providerStatus[name].available = true;
}

async function callGroq(messages) {
    if (!GROQ_API_KEY || isInCooldown('groq')) {
        throw new Error('Groq no disponible');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages,
            temperature: 0.7,
            max_tokens: 2048
        })
    });

    if (!response.ok) {
        recordFailure('groq');
        throw new Error(`Groq error ${response.status}`);
    }

    recordSuccess('groq');
    const data = await response.json();
    return data.choices?.[0]?.message?.content;
}

async function callOpenRouter(messages) {
    if (!OPENROUTER_API_KEY || isInCooldown('openrouter')) {
        throw new Error('OpenRouter no disponible');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages,
            temperature: 0.7,
            max_tokens: 2048
        })
    });

    if (!response.ok) {
        recordFailure('openrouter');
        throw new Error(`OpenRouter error ${response.status}`);
    }

    recordSuccess('openrouter');
    const data = await response.json();
    return data.choices?.[0]?.message?.content;
}

// Sistema de fallback: Groq → OpenRouter
async function getAIResponse(messages) {
    try {
        return await callGroq(messages);
    } catch (e) {
        console.log(`[AI] Groq falló: ${e.message}, intentando OpenRouter...`);
    }

    try {
        return await callOpenRouter(messages);
    } catch (e) {
        console.log(`[AI] OpenRouter falló: ${e.message}`);
    }

    return 'Todos los providers están indisponibles. Intenta de nuevo en unos segundos.';
}

function getProviderStatus() {
    return {
        groq: { enabled: !!GROQ_API_KEY, inCooldown: isInCooldown('groq'), model: GROQ_MODEL },
        openrouter: { enabled: !!OPENROUTER_API_KEY, inCooldown: isInCooldown('openrouter'), model: OPENROUTER_MODEL }
    };
}

module.exports = {
    getAIResponse,
    getProviderStatus,
    callGroq,
    callOpenRouter
};
