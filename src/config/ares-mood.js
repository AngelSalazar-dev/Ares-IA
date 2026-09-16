/**
 * Ares Mood System
 * Gestiona el estado emocional de Ares basado en interacciones
 */

const { EMOTIONS } = require('./emotions');

// Estados de humor de Ares
const MOODS = {
    neutral: {
        id: 'neutral',
        name: 'Neutral',
        emoji: '🤖',
        behavior: 'estándar, eficiente, profesional'
    },
    cheerful: {
        id: 'cheerful',
        name: 'Alegre',
        emoji: '😊',
        behavior: 'más amigable, usa más emojis, respuestas más largas'
    },
    serious: {
        id: 'serious',
        name: 'Serio',
        emoji: '🧐',
        behavior: 'más formal, menos emojis, preciso'
    },
    empathetic: {
        id: 'empathetic',
        name: 'Empático',
        emoji: '💙',
        behavior: 'más comprensivo, valida emociones, consejos suaves'
    },
    energetic: {
        id: 'energetic',
        name: 'Enérgico',
        emoji: '⚡',
        behavior: 'más entusiasta, respuestas más largas, proactivo'
    },
    cautious: {
        id: 'cautious',
        name: 'Cauto',
        emoji: '⚠️',
        behavior: 'más advertencias, pide confirmación, verifica'
    }
};

// Mapeo de emoción del usuario → humor de Ares
const EMOTION_TO_MOOD = {
    [EMOTIONS.happy]: MOODS.cheerful,
    [EMOTIONS.sad]: MOODS.empathetic,
    [EMOTIONS.angry]: MOODS.cautious,
    [EMOTIONS.frustrated]: MOODS.empathetic,
    [EMOTIONS.anxious]: MOODS.empathetic,
    [EMOTIONS.excited]: MOODS.energetic,
    [EMOTIONS.grateful]: MOODS.cheerful,
    [EMOTIONS.curious]: MOODS.energetic,
    [EMOTIONS.tired]: MOODS.empathetic,
    [EMOTIONS.confident]: MOODS.neutral,
    [EMOTIONS.overwhelmed]: MOODS.empathetic,
    [EMOTIONS.neutral]: MOODS.neutral
};

// Reglas de cambio de humor basadas en contexto
const MOOD_RULES = [
    {
        condition: (ctx) => ctx.commandErrors > 3,
        mood: MOODS.cautious,
        reason: 'Demasiados errores de comandos'
    },
    {
        condition: (ctx) => ctx.sessionDuration > 3600,
        mood: MOODS.energetic,
        reason: 'Sesión larga, mantener energía'
    },
    {
        condition: (ctx) => ctx.toolUsageCount > 10,
        mood: MOODS.energetic,
        reason: 'Muchas herramientas usadas, mantener ritmo'
    },
    {
        condition: (ctx) => ctx.userSentGratitude,
        mood: MOODS.cheerful,
        reason: 'Usuario expresó gratitud'
    },
    {
        condition: (ctx) => ctx.lastUserEmotion === EMOTIONS.angry,
        mood: MOODS.cautious,
        reason: 'Usuario enojado'
    }
];

class AresMood {
    constructor() {
        this.currentMood = MOODS.neutral;
        this.moodHistory = [];
        this.context = {
            commandErrors: 0,
            sessionDuration: 0,
            toolUsageCount: 0,
            userSentGratitude: false,
            lastUserEmotion: EMOTIONS.neutral,
            startTime: Date.now()
        };
        this.moodStartTime = Date.now();
    }

    /**
     * Actualiza el humor basado en la emoción del usuario
     * @param {string} userEmotion - Emoción detectada del usuario
     * @returns {Object} - Nuevo humor aplicado
     */
    updateFromUserEmotion(userEmotion) {
        this.context.lastUserEmotion = userEmotion;

        // Buscar regla de contexto primero
        for (const rule of MOOD_RULES) {
            if (rule.condition(this.context)) {
                this._setMood(rule.mood, rule.reason);
                return this.currentMood;
            }
        }

        // Aplicar mapeo de emoción
        const newMood = EMOTION_TO_MOOD[userEmotion] || MOODS.neutral;
        this._setMood(newMood, `Emoción del usuario: ${userEmotion}`);

        return this.currentMood;
    }

    /**
     * Registra un error de comando
     */
    recordCommandError() {
        this.context.commandErrors++;
        this._applyRules();
    }

    /**
     * Registra uso de herramienta
     */
    recordToolUsage() {
        this.context.toolUsageCount++;
        this._applyRules();
    }

    /**
     * Registra gratitud del usuario
     */
    recordUserGratitude() {
        this.context.userSentGratitude = true;
        this._setMood(MOODS.cheerful, 'Usuario agradecido');
    }

    /**
     * Obtiene el humor actual
     * @returns {Object} - Humor actual con emoji y nombre
     */
    getMood() {
        return {
            ...this.currentMood,
            duration: Date.now() - this.moodStartTime,
            history: this.moodHistory.slice(-5)
        };
    }

    /**
     * Genera el sufijo de humor para el system prompt
     * @returns {string} - Texto para agregar al system prompt
     */
    getMoodSuffix() {
        const mood = this.currentMood;
        const duration = Math.round((Date.now() - this.moodStartTime) / 60000);

        return `
ESTADO ACTUAL DE ARES:
- Humor: ${mood.name} ${mood.emoji}
- Comportamiento: ${mood.behavior}
- Duración del humor: ${duration} minutos
- Sesión activa: ${Math.round((Date.now() - this.context.startTime) / 60000)} minutos
- Errores en sesión: ${this.context.commandErrors}
- Herramientas usadas: ${this.context.toolUsageCount}`;
    }

    /**
     * Resetea el humor a neutral
     */
    reset() {
        this.currentMood = MOODS.neutral;
        this.moodHistory = [];
        this.context = {
            commandErrors: 0,
            sessionDuration: 0,
            toolUsageCount: 0,
            userSentGratitude: false,
            lastUserEmotion: EMOTIONS.neutral,
            startTime: Date.now()
        };
        this.moodStartTime = Date.now();
    }

    // --- Métodos privados ---

    _setMood(mood, reason) {
        if (this.currentMood.id !== mood.id) {
            this.moodHistory.push({
                from: this.currentMood.id,
                to: mood.id,
                reason,
                timestamp: Date.now()
            });

            this.currentMood = mood;
            this.moodStartTime = Date.now();

            // Limitar historial
            if (this.moodHistory.length > 20) {
                this.moodHistory = this.moodHistory.slice(-20);
            }
        }
    }

    _applyRules() {
        for (const rule of MOOD_RULES) {
            if (rule.condition(this.context)) {
                this._setMood(rule.mood, rule.reason);
                break;
            }
        }
    }
}

module.exports = {
    MOODS,
    AresMood
};
