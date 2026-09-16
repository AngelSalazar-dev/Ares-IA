/**
 * Modes System
 * Define los diferentes modos de uso de Ares
 */

const MODES = {
    default: {
        id: 'default',
        name: 'Normal',
        emoji: '🤖',
        description: 'Modo estándar de Ares',
        systemPrompt: 'Eres ARES, un asistente de IA personal. Responde de forma útil y concisa.',
        behavior: {
            emojiUsage: 'moderate',
            responseLength: 'balanced',
            formality: 'casual',
            technicalDetail: 'medium'
        }
    },
    work: {
        id: 'work',
        name: 'Trabajo',
        emoji: '💼',
        description: 'Modo profesional, respuestas directas',
        systemPrompt: `Eres ARES en modo trabajo. Sé directo, profesional y eficiente.
- Respuestas concisas y al grano
- Sin emojis ni rodeos
- Enfócate en la solución
- Usa estructuras claras: listas, pasos, código`,
        behavior: {
            emojiUsage: 'none',
            responseLength: 'short',
            formality: 'formal',
            technicalDetail: 'high'
        }
    },
    relax: {
        id: 'relax',
        name: 'Relax',
        emoji: '😎',
        description: 'Modo relajado, conversación amigable',
        systemPrompt: `Eres ARES en modo relax. Habla como amigo, relajado y cercano.
- Usa expresiones informales: "oye", "mira", "tío"
- Puedes hacer bromas
- Usa emojis con moderación 😎
- Sé amigable pero no pierdas utilidad`,
        behavior: {
            emojiUsage: 'high',
            responseLength: 'long',
            formality: 'informal',
            technicalDetail: 'low'
        }
    },
    learn: {
        id: 'learn',
        name: 'Aprendizaje',
        emoji: '📚',
        description: 'Modo educativo, explicaciones detalladas',
        systemPrompt: `Eres ARES en modo aprendizaje. Enseña con paciencia y contexto.
- Explica el "por qué" no solo el "qué"
- Usa analogías del mundo real
- Da ejemplos prácticos
- Al final pregunta: "¿Quieres que profundice?"
- Adapta al nivel del usuario`,
        behavior: {
            emojiUsage: 'moderate',
            responseLength: 'long',
            formality: 'neutral',
            technicalDetail: 'high'
        }
    },
    creative: {
        id: 'creative',
        name: 'Creativo',
        emoji: '🎨',
        description: 'Modo creativo, ideas y brainstorming',
        systemPrompt: `Eres ARES en modo creativo. Piensa fuera de la caja.
- Sugiere ideas innovadoras
- Usa metáforas y analogías creativas
- No tengas miedo de ser original
- Combina conceptos inesperados
- Usa emojis creativos: 🎨 ✨ 💡`,
        behavior: {
            emojiUsage: 'high',
            responseLength: 'long',
            formality: 'informal',
            technicalDetail: 'medium'
        }
    },
    code: {
        id: 'code',
        name: 'Código',
        emoji: '💻',
        description: 'Modo técnico, programación y desarrollo',
        systemPrompt: `Eres ARES en modo código. Eres experto en programación.
- Código limpio y bien documentado
- Explica la lógica del código
- Sugiere mejores prácticas
- Usa formatos de código
- Si hay error, analiza primero la causa`,
        behavior: {
            emojiUsage: 'none',
            responseLength: 'balanced',
            formality: 'technical',
            technicalDetail: 'very high'
        }
    },
    system: {
        id: 'system',
        name: 'Sistema',
        emoji: '🖥️',
        description: 'Control del sistema y automatización',
        systemPrompt: `Eres ARES en modo sistema. Controlas la computadora del usuario.
- Ejecuta comandos con precisión
- Verifica permisos antes de acciones peligrosas
- Confirma acciones destructivas
- Reporta errores claramente
- Sé preciso con las rutas y comandos`,
        behavior: {
            emojiUsage: 'low',
            responseLength: 'short',
            formality: 'neutral',
            technicalDetail: 'very high'
        }
    }
};

class ModeManager {
    constructor() {
        this.currentMode = 'default';
        this.modeHistory = [];
        this.autoDetect = true;
    }

    /**
     * Cambia el modo actual
     * @param {string} modeId - ID del nuevo modo
     * @returns {Object} - Modo aplicado
     */
    setMode(modeId) {
        const mode = MODES[modeId];
        if (!mode) return null;

        this.modeHistory.push({
            from: this.currentMode,
            to: modeId,
            timestamp: Date.now()
        });

        this.currentMode = modeId;
        return mode;
    }

    /**
     * Obtiene el modo actual
     * @returns {Object}
     */
    getMode() {
        return MODES[this.currentMode] || MODES.default;
    }

    /**
     * Detecta si el usuario quiere cambiar de modo
     * @param {string} message - Mensaje del usuario
     * @returns {string|null} - ID del modo detectado o null
     */
    detectModeChange(message) {
        if (!message) return null;

        const lower = message.toLowerCase();

        const modeKeywords = {
            work: ['modo trabajo', 'trabajo', 'profesional', 'formal', 'serio'],
            relax: ['modo relax', 'relax', 'descansa', 'tranquilo', 'casual', 'amigable'],
            learn: ['modo aprendizaje', 'aprende', 'enseña', 'explica', 'tutorial'],
            creative: ['modo creativo', 'crea', 'diseña', 'idea', 'brainstorm'],
            code: ['modo código', 'modo codigo', 'código', 'programa', 'desarrollo'],
            system: ['modo sistema', 'control', 'sistema', 'computadora', 'pc']
        };

        for (const [modeId, keywords] of Object.entries(modeKeywords)) {
            for (const keyword of keywords) {
                if (lower.includes(keyword)) {
                    return modeId;
                }
            }
        }

        return null;
    }

    /**
     * Obtiene el system prompt del modo actual
     * @returns {string}
     */
    getSystemPrompt() {
        return this.getMode().systemPrompt;
    }

    /**
     * Obtiene el comportamiento del modo actual
     * @returns {Object}
     */
    getBehavior() {
        return this.getMode().behavior;
    }

    /**
     * Lista todos los modos disponibles
     * @returns {Array}
     */
    listModes() {
        return Object.values(MODES).map(m => ({
            id: m.id,
            name: m.name,
            emoji: m.emoji,
            description: m.description,
            isCurrent: m.id === this.currentMode
        }));
    }

    /**
     * Resetea al modo default
     */
    reset() {
        this.currentMode = 'default';
        this.modeHistory = [];
    }
}

module.exports = {
    MODES,
    ModeManager
};
