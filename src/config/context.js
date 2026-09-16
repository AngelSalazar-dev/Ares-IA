/**
 * Context Window Management
 * Ventana de contexto optimizada para 131K tokens (máximo del modelo)
 */

// Configuración de la ventana de contexto
const CONTEXT_CONFIG = {
    MAX_CONTEXT_WINDOW: 131_072,   // 131K tokens - máximo del modelo gpt-oss-120b
    RESERVE_FOR_RESPONSE: 4_096,   // Reservado para la respuesta del modelo
    TOKENS_PER_CHAR: 0.25,         // ~4 caracteres por token (promedio)
    MAX_CHARS_FACTOR: 0.85,        // Factor de seguridad para caracteres
    COMPRESION_THRESHOLD: 0.8,     // Umbral para comprimir contexto
    SYSTEM_PROMPT_BUDGET: 2_000,   // Tokens reservados para system prompt
    HISTORY_BUDGET: 0.7            // 70% del contexto para historial
};

// Límites de mensajes
const MESSAGE_LIMITS = {
    MAX_MESSAGES: 200,
    MIN_MESSAGES_TO_COMPRESS: 10,
    KEEP_RECENT: 20,
    KEEP_FIRST: 5
};

class ContextManager {
    constructor(options = {}) {
        this.maxTokens = options.maxTokens || CONTEXT_CONFIG.MAX_CONTEXT_WINDOW;
        this.reserveForResponse = options.reserveForResponse || CONTEXT_CONFIG.RESERVE_FOR_RESPONSE;
        this.systemPromptBudget = options.systemPromptBudget || CONTEXT_CONFIG.SYSTEM_PROMPT_BUDGET;

        // Calcular límites de caracteres
        this.maxChars = Math.floor(
            (this.maxTokens - this.reserveForResponse - this.systemPromptBudget) *
            CONTEXT_CONFIG.TOKENS_PER_CHAR *
            CONTEXT_CONFIG.MAX_CHARS_FACTOR
        );

        this.history = [];
        this.totalTokensEstimate = 0;
    }

    /**
     * Agrega un mensaje al historial
     * @param {string} role - 'user' o 'assistant'
     * @param {string} content - Contenido del mensaje
     * @returns {Object} - { added, tokensEstimate, historySize }
     */
    addMessage(role, content) {
        const tokensEstimate = this.estimateTokens(content);

        this.history.push({
            role,
            content,
            tokensEstimate,
            timestamp: Date.now()
        });

        this.totalTokensEstimate += tokensEstimate;

        // Comprimir si excedemos el límite
        if (this.history.length > MESSAGE_LIMITS.MAX_MESSAGES) {
            this._compressHistory();
        }

        return {
            added: true,
            tokensEstimate,
            historySize: this.history.length,
            totalTokens: this.totalTokensEstimate
        };
    }

    /**
     * Obtiene los mensajes para enviar al modelo
     * @returns {Array} - Lista de mensajes en formato OpenAI
     */
    getMessages() {
        return this.history.map(m => ({
            role: m.role,
            content: m.content
        }));
    }

    /**
     * Obtiene el historial comprimido para el contexto
     * @returns {Array} - Mensajes optimizados
     */
    getOptimizedMessages() {
        if (this.history.length <= MESSAGE_LIMITS.MIN_MESSAGES_TO_COMPRESS) {
            return this.getMessages();
        }

        const messages = [];

        // Mantener primeros mensajes (contexto inicial)
        const firstMessages = this.history.slice(0, MESSAGE_LIMITS.KEEP_FIRST);
        messages.push(...firstMessages.map(m => ({ role: m.role, content: m.content })));

        // Agregar resumen del contexto perdido
        const middleMessages = this.history.slice(
            MESSAGE_LIMITS.KEEP_FIRST,
            this.history.length - MESSAGE_LIMITS.KEEP_RECENT
        );

        if (middleMessages.length > 0) {
            const summary = this._generateSummary(middleMessages);
            messages.push({
                role: 'system',
                content: `[Contexto de ${middleMessages.length} mensajes anteriores]: ${summary}`
            });
        }

        // Mantener últimos mensajes (más relevantes)
        const recentMessages = this.history.slice(-MESSAGE_LIMITS.KEEP_RECENT);
        messages.push(...recentMessages.map(m => ({ role: m.role, content: m.content })));

        return messages;
    }

    /**
     * Estima la cantidad de tokens en un texto
     * @param {string} text - Texto a evaluar
     * @returns {number} - Tokens estimados
     */
    estimateTokens(text) {
        if (!text) return 0;
        // Aproximación: 1 token ≈ 4 caracteres en español
        return Math.ceil(text.length / 4);
    }

    /**
     * Verifica si hay suficiente espacio para un nuevo mensaje
     * @param {string} content - Contenido del mensaje
     * @returns {boolean}
     */
    hasSpace(content) {
        const estimatedTokens = this.estimateTokens(content);
        const usedTokens = this.totalTokensEstimate + this.systemPromptBudget;
        return (usedTokens + estimatedTokens) < (this.maxTokens - this.reserveForResponse);
    }

    /**
     * Obtiene estadísticas del contexto
     * @returns {Object}
     */
    getStats() {
        const usedTokens = this.totalTokensEstimate + this.systemPromptBudget;
        const availableTokens = this.maxTokens - this.reserveForResponse - usedTokens;

        return {
            maxTokens: this.maxTokens,
            usedTokens,
            availableTokens,
            usagePercent: Math.round((usedTokens / this.maxTokens) * 100),
            historySize: this.history.length,
            maxChars: this.maxChars,
            estimatedChars: Math.round(usedTokens / CONTEXT_CONFIG.TOKENS_PER_CHAR)
        };
    }

    /**
     * Limpia el historial
     */
    clear() {
        this.history = [];
        this.totalTokensEstimate = 0;
    }

    /**
     * Exporta el historial para persistencia
     * @returns {Object}
     */
    export() {
        return {
            history: this.history,
            totalTokensEstimate: this.totalTokensEstimate,
            config: {
                maxTokens: this.maxTokens,
                reserveForResponse: this.reserveForResponse
            }
        };
    }

    /**
     * Importa historial desde persistencia
     * @param {Object} data - Datos exportados
     */
    import(data) {
        if (data.history) {
            this.history = data.history;
            this.totalTokensEstimate = data.totalTokensEstimate || 0;
        }
    }

    // --- Métodos privados ---

    _compressHistory() {
        const keepFirst = this.history.slice(0, MESSAGE_LIMITS.KEEP_FIRST);
        const keepRecent = this.history.slice(-MESSAGE_LIMITS.KEEP_RECENT);

        const compressed = this.history.slice(
            MESSAGE_LIMITS.KEEP_FIRST,
            this.history.length - MESSAGE_LIMITS.KEEP_RECENT
        );

        // Generar resumen
        const summary = this._generateSummary(compressed);

        // Reconstruir historial
        this.history = [
            ...keepFirst,
            {
                role: 'system',
                content: `[${compressed.length} mensajes comprimidos]: ${summary}`,
                tokensEstimate: this.estimateTokens(summary),
                timestamp: Date.now()
            },
            ...keepRecent
        ];

        // Recalcular tokens
        this.totalTokensEstimate = this.history.reduce(
            (sum, m) => sum + (m.tokensEstimate || 0),
            0
        );
    }

    _generateSummary(messages) {
        if (messages.length === 0) return '';

        const topics = new Set();
        let lastUserMessage = '';

        for (const msg of messages) {
            if (msg.role === 'user') {
                lastUserMessage = msg.content.substring(0, 100);
                // Extraer posibles temas
                const words = msg.content.split(' ').slice(0, 5);
                words.forEach(w => topics.add(w.toLowerCase()));
            }
        }

        const topicList = Array.from(topics).slice(0, 10).join(', ');
        return `Temas discutidos: ${topicList}. Último mensaje del usuario: "${lastUserMessage}..."`;
    }
}

module.exports = {
    CONTEXT_CONFIG,
    MESSAGE_LIMITS,
    ContextManager
};
