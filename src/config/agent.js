/**
 * Agent Configuration
 * Orquestador principal del agente Ares
 */

const { detectUserEmotion, isConversationalIntent, isTechnicalIntent } = require('./emotions');
const { getPersonality } = require('./personalities');
const { AresMood } = require('./ares-mood');
const { ContextManager } = require('./context');
const { PermissionManager } = require('./permissions');

class AresAgent {
    constructor(options = {}) {
        // Configuración
        this.personalityId = options.personality || 'default';
        this.sessionId = options.sessionId || 'default';

        // Componentes
        this.mood = new AresMood();
        this.context = new ContextManager(options.context);
        this.permissions = new PermissionManager();

        // Estado
        this.lastUserEmotion = null;
        this.isProcessing = false;
        this.toolCallCount = 0;

        // Inicializar sesión
        this.permissions.createSession(this.sessionId, 1);
    }

    /**
     * Procesa un mensaje del usuario
     * @param {string} userMessage - Mensaje del usuario
     * @returns {Object} - { response, toolCalls, emotion, mood, personality }
     */
    async processMessage(userMessage) {
        this.isProcessing = true;

        try {
            // 1. Detectar emoción del usuario
            const emotion = detectUserEmotion(userMessage);
            this.lastUserEmotion = emotion;

            // 2. Actualizar humor de Ares
            this.mood.updateFromUserEmotion(emotion.emotion);

            // 3. Detectar intención
            const intent = this._detectIntent(userMessage);

            // 4. Obtener personalidad activa
            const personality = getPersonality(this.personalityId);

            // 5. Agregar mensaje al contexto
            this.context.addMessage('user', userMessage);

            // 6. Construir system prompt
            const systemPrompt = this._buildSystemPrompt(personality, emotion, intent);

            // 7. Obtener mensajes optimizados
            const messages = [
                { role: 'system', content: systemPrompt },
                ...this.context.getOptimizedMessages()
            ];

            // 8. Preparar herramientas disponibles
            const tools = this._getAvailableTools();

            this.isProcessing = false;

            return {
                messages,
                tools,
                emotion,
                intent,
                personality: {
                    id: personality.id,
                    name: personality.name,
                    emoji: personality.emoji
                },
                mood: this.mood.getMood(),
                contextStats: this.context.getStats()
            };

        } catch (error) {
            this.isProcessing = false;
            throw error;
        }
    }

    /**
     * Registra la respuesta del asistente
     * @param {string} response - Respuesta generada
     * @param {Array} toolCalls - Llamadas a herramientas realizadas
     */
    recordResponse(response, toolCalls = []) {
        // Agregar respuesta al contexto
        this.context.addMessage('assistant', response);

        // Registrar uso de herramientas
        for (const call of toolCalls) {
            this.mood.recordToolUsage();
            this.toolCallCount++;
        }

        // Verificar si hubo errores
        const hasErrors = toolCalls.some(t => t.error);
        if (hasErrors) {
            this.mood.recordCommandError();
        }
    }

    /**
     * Cambia la personalidad activa
     * @param {string} personalityId - ID de la nueva personalidad
     */
    setPersonality(personalityId) {
        this.personalityId = personalityId;
    }

    /**
     * Obtiene el estado completo del agente
     * @returns {Object}
     */
    getState() {
        return {
            sessionId: this.sessionId,
            personality: this.personalityId,
            mood: this.mood.getMood(),
            emotion: this.lastUserEmotion,
            context: this.context.getStats(),
            permissions: this.permissions.getSession(this.sessionId),
            isProcessing: this.isProcessing,
            toolCallCount: this.toolCallCount
        };
    }

    /**
     * Resetea el estado del agente
     */
    reset() {
        this.personalityId = 'default'; // Resetear personalidad
        this.mood.reset();
        this.context.clear();
        this.lastUserEmotion = null;
        this.toolCallCount = 0;
        this.permissions.destroySession(this.sessionId);
        this.permissions.createSession(this.sessionId, 1);
    }

    /**
     * Exporta el estado para persistencia
     * @returns {Object}
     */
    exportState() {
        return {
            sessionId: this.sessionId,
            personalityId: this.personalityId,
            mood: this.mood.getMood(),
            context: this.context.export(),
            toolCallCount: this.toolCallCount
        };
    }

    /**
     * Importa estado desde persistencia
     * @param {Object} state
     */
    importState(state) {
        if (state.personalityId) this.personalityId = state.personalityId;
        if (state.context) this.context.import(state.context);
        if (state.toolCallCount) this.toolCallCount = state.toolCallCount;
    }

    // --- Métodos privados ---

    _detectIntent(message) {
        if (isConversationalIntent(message)) {
            return { type: 'conversational', isTechnical: false };
        }
        if (isTechnicalIntent(message)) {
            return { type: 'technical', isTechnical: true };
        }
        return { type: 'general', isTechnical: false };
    }

    _buildSystemPrompt(personality, emotion, intent) {
        let prompt = personality.systemPrompt;

        // Agregar información de emoción detectada
        prompt += `\n\nEMOCIÓN DETECTADA DEL USUARIO: ${emotion.emotion} ${emotion.emoji}`;
        if (emotion.intensity > 0.5) {
            prompt += `\nINTENSIDAD: Alta - Responde con empatía y consideración.`;
        }

        // Agregar información de intención
        if (intent.isTechnical) {
            prompt += `\n\nINTENCIÓN: Técnica - Enfócate en la solución técnica, sé preciso y usa ejemplos de código cuando sea apropiado.`;
        } else if (intent.type === 'conversational') {
            prompt += `\n\nINTENCIÓN: Conversación - Sé amigable y cercano, mantén el flujo natural de la conversación.`;
        }

        // Agregar estado del humor
        prompt += this.mood.getMoodSuffix();

        // Agregar contexto de sesión
        const stats = this.context.getStats();
        prompt += `\n\nCONTEXTO DE SESIÓN:
- Mensajes en historial: ${stats.historySize}
- Tokens usados: ${stats.usedTokens} / ${stats.maxTokens}
- Uso: ${stats.usagePercent}%`;

        return prompt;
    }

    _getAvailableTools() {
        const session = this.permissions.getSession(this.sessionId);
        if (!session) return [];

        const { TOOLS } = require('./tools');
        const { PERMISSION_LEVELS } = require('./permissions');

        return TOOLS.filter(tool => {
            return session.permissions.includes(tool.requiresPermission);
        });
    }
}

module.exports = { AresAgent };
