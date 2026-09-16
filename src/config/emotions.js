/**
 * Emotion Detection System
 * Detecta la emoción del usuario y la intención de su mensaje
 */

// Tipos de emoción
const EMOTIONS = {
    neutral: 'neutral',
    happy: 'happy',
    sad: 'sad',
    angry: 'angry',
    frustrated: 'frustrated',
    anxious: 'anxious',
    excited: 'excited',
    grateful: 'grateful',
    curious: 'curious',
    tired: 'tired',
    confident: 'confident',
    overwhelmed: 'overwhelmed'
};

// Palabras clave por emoción
const EMOTION_KEYWORDS = {
    [EMOTIONS.happy]: [
        'genial', 'increíble', 'excelente', 'perfecto', 'bien', 'bueno',
        'gracias', 'me gusta', 'fantástico', 'maravilloso', 'contento',
        'alegre', 'feliz', 'cool', 'joya', 'top', 'chido', 'padre'
    ],
    [EMOTIONS.sad]: [
        'triste', 'mal', 'horrible', 'terrible', 'pesado', 'dolor',
        'solo', 'perdí', 'perder', 'adiós', 'llorar', 'vacío',
        'deprimido', 'me siento mal', 'no puedo', 'cansado de todo'
    ],
    [EMOTIONS.angry]: [
        'enojado', 'furioso', 'molesto', 'rabia', 'odio', 'estúpido',
        'idiota', 'inútil', 'basura', 'maldita', 'harto', 'harté',
        'no soporto', 'me caga', 'pinche', 'no mames'
    ],
    [EMOTIONS.frustrated]: [
        'frustrado', 'no funciona', 'no entiendo', 'error', 'problema',
        'complicado', 'difícil', 'imposible', 'stuck', 'atascado',
        'no logro', 'no puedo con esto', 'me rindo'
    ],
    [EMOTIONS.anxious]: [
        'nervioso', 'preocupado', 'ansioso', 'miedo', 'pánico',
        'estrés', 'presión', 'urgente', 'no sé qué hacer', 'ayuda',
        'what if', 'y si', 'que tal si', 'me da miedo'
    ],
    [EMOTIONS.excited]: [
        'emocionado', 'ansioso por', 'esperando', 'impaciente',
        'nuevo proyecto', 'nueva idea', 'voy a empezar', 'listo para',
        'pumped', "let's go", 'vamos', 'dale'
    ],
    [EMOTIONS.grateful]: [
        'gracias', 'te agradezco', 'útil', 'me sirvió',
        'resuelto', 'perfecto', 'eres genial', 'lo logré', 'funcionó'
    ],
    [EMOTIONS.curious]: [
        'cómo', 'por qué', 'qué es', 'cuál', 'cuándo', 'dónde',
        'explíca', 'enseña', 'quiero aprender', 'interesante',
        'cuéntame', 'dime más', 'curioso'
    ],
    [EMOTIONS.tired]: [
        'cansado', 'agotado', 'sin energía', 'sleepy', 'sueño',
        'no puedo más', 'exhausto', 'muerto', 'burnout', 'quemado'
    ],
    [EMOTIONS.confident]: [
        'sé que puedo', 'fácil', 'lo tengo', 'directo', 'simple',
        'sencillo', 'no es tan difícil', 'ya sé', 'obvio'
    ],
    [EMOTIONS.overwhelmed]: [
        'sobrecargado', 'demasiado', 'no doy abasto', 'tengo mucho',
        'no termino', 'me abruma', 'no sé por dónde empezar',
        'todo a la vez', 'caos'
    ]
};

// Emojis por emoción
const EMOTION_EMOJIS = {
    [EMOTIONS.neutral]: '😐',
    [EMOTIONS.happy]: '😊',
    [EMOTIONS.sad]: '😢',
    [EMOTIONS.angry]: '😤',
    [EMOTIONS.frustrated]: '😖',
    [EMOTIONS.anxious]: '😰',
    [EMOTIONS.excited]: '🔥',
    [EMOTIONS.grateful]: '🙏',
    [EMOTIONS.curious]: '🤔',
    [EMOTIONS.tired]: '😴',
    [EMOTIONS.confident]: '💪',
    [EMOTIONS.overwhelmed]: '😵'
};

// Palabras clave de intención conversacional
const CONVERSATIONAL_KEYWORDS = [
    'hola', 'hello', 'hey', 'buenos días', 'buenas tardes', 'buenas noches',
    'qué tal', 'cómo estás', 'cómo vas', 'qué onda',
    'quién eres', 'qué eres', 'cómo te llamas',
    'cuéntame de ti', 'háblame de ti',
    'quiero hablar', 'hablemos', 'charlemos',
    'me siento solo', 'estoy triste', 'necesito hablar',
    'gracias', 'te quiero', 'eres genial'
];

// Palabras clave de intención técnica
const TECHNICAL_KEYWORDS = [
    'código', 'code', 'función', 'function', 'clase', 'class',
    'error', 'bug', 'debug', 'compilar', 'compila',
    'api', 'endpoint', 'servidor', 'server', 'base de datos', 'database',
    'html', 'css', 'javascript', 'python', 'java', 'react', 'node',
    'git', 'docker', 'linux', 'terminal', 'comando',
    'instalar', 'installa', 'configurar', 'configura',
    'roadmap', 'tutorial', 'ejemplo', 'ejercicio'
];

/**
 * Detecta la emoción dominante del usuario
 * @param {string} text - Texto del usuario
 * @returns {Object} - { emotion, intensity, emoji }
 */
function detectUserEmotion(text) {
    if (!text || typeof text !== 'string') {
        return { emotion: EMOTIONS.neutral, intensity: 0.3, emoji: '😐' };
    }

    const lower = text.toLowerCase();
    const scores = {};

    // Inicializar scores
    for (const emotion of Object.values(EMOTIONS)) {
        scores[emotion] = 0;
    }

    // Score por palabras clave (con pesos específicos)
    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
        for (const keyword of keywords) {
            if (lower.includes(keyword)) {
                // Mayor peso para emociones específicas
                if (emotion === EMOTIONS.grateful) {
                    scores[emotion] += 1.5; // Priorizar gratitud sobre happy
                } else {
                    scores[emotion] += 1;
                }
            }
        }
    }

    // Intensificadores de puntuación
    if (text.includes('!')) {
        scores[EMOTIONS.happy] += 0.3;
        scores[EMOTIONS.angry] += 0.3;
        scores[EMOTIONS.excited] += 0.3;
    }
    if (text.includes('?')) {
        scores[EMOTIONS.curious] += 0.5;
    }
    // Mayúsculas fuertes (más de 3 caracteres) indican enojo/frustración
    if (text === text.toUpperCase() && text.length > 3) {
        scores[EMOTIONS.angry] += 2; // Mayor peso para mayúsculas
        scores[EMOTIONS.frustrated] += 1;
    }

    // Encontrar emoción dominante
    let maxEmotion = EMOTIONS.neutral;
    let maxScore = 0;

    for (const [emotion, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            maxEmotion = emotion;
        }
    }

    const intensity = Math.min(maxScore / 3, 1);

    if (maxScore === 0) {
        return { emotion: EMOTIONS.neutral, intensity: 0.3, emoji: '😐' };
    }

    return {
        emotion: maxEmotion,
        intensity,
        emoji: EMOTION_EMOJIS[maxEmotion] || '😐'
    };
}

/**
 * Detecta si el usuario quiere conversar (no técnico)
 * @param {string} text - Texto del usuario
 * @returns {boolean}
 */
function isConversationalIntent(text) {
    if (!text || typeof text !== 'string') return false;

    const lower = text.toLowerCase().trim();

    // Verificar palabras clave conversacionales
    for (const keyword of CONVERSATIONAL_KEYWORDS) {
        if (lower.includes(keyword)) {
            return true;
        }
    }

    // Mensajes cortos sin código son conversacionales
    if (lower.length < 15 && !lower.includes('{') && !lower.includes('(') && !lower.includes('=')) {
        return true;
    }

    return false;
}

/**
 * Detecta si el usuario necesita ayuda técnica
 * @param {string} text - Texto del usuario
 * @returns {boolean}
 */
function isTechnicalIntent(text) {
    if (!text || typeof text !== 'string') return false;

    const lower = text.toLowerCase();

    // Verificar palabras clave técnicas
    for (const keyword of TECHNICAL_KEYWORDS) {
        if (lower.includes(keyword)) {
            return true;
        }
    }

    // Detectar patrones de código
    if (/[{}\[\]();]/.test(text) || /[=><]+/.test(text)) {
        return true;
    }

    return false;
}

module.exports = {
    EMOTIONS,
    EMOTION_EMOJIS,
    detectUserEmotion,
    isConversationalIntent,
    isTechnicalIntent
};
