/**
 * AI Routes
 * Rutas para interacciones con el agente Ares
 */

const express = require('express');
const router = express.Router();
const { AresAgent } = require('../config/agent');
const { ToolExecutor } = require('../services/toolExecutor');
const { listPersonalities } = require('../config/personalities');
const { toOpenAIFunctions } = require('../config/tools');

// Instancia global del executor
const toolExecutor = new ToolExecutor();

// Almacenamiento de agentes por sesión
const agents = new Map();

/**
 * GET /api/ai/status
 * Estado del agente
 */
router.get('/status', (req, res) => {
    const sessionId = req.headers['x-session-id'] || 'default';
    const agent = agents.get(sessionId);

    res.json({
        status: 'online',
        sessionId,
        agent: agent ? agent.getState() : null,
        personalities: listPersonalities(),
        tools: toOpenAIFunctions().length
    });
});

/**
 * POST /api/ai/chat
 * Chat con el agente
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, personality } = req.body;
        const sessionId = req.headers['x-session-id'] || 'default';

        if (!message) {
            return res.status(400).json({ error: 'Mensaje requerido' });
        }

        // Obtener o crear agente
        let agent = agents.get(sessionId);
        if (!agent) {
            agent = new AresAgent({ sessionId, personality });
            agents.set(sessionId, agent);
        }

        // Actualizar personalidad si se especifica
        if (personality) {
            agent.setPersonality(personality);
        }

        // Procesar mensaje
        const result = await agent.processMessage(message);

        // Preparar respuesta para el modelo
        const responsePayload = {
            model: 'openai/gpt-oss-120b',
            messages: result.messages,
            temperature: 0.7,
            max_tokens: 4096
        };

        // Agregar herramientas si están disponibles
        if (result.tools.length > 0) {
            responsePayload.tools = result.tools.map(tool => ({
                type: 'function',
                function: {
                    name: tool.id,
                    description: tool.description,
                    parameters: {
                        type: 'object',
                        properties: Object.fromEntries(
                            Object.entries(tool.parameters).map(([key, param]) => [
                                key,
                                {
                                    type: param.type,
                                    description: param.description,
                                    ...(param.enum && { enum: param.enum })
                                }
                            ])
                        ),
                        required: Object.entries(tool.parameters)
                            .filter(([, param]) => param.required)
                            .map(([key]) => key)
                    }
                }
            }));
        }

        // Retornar información para que el cliente llame al proveedor
        res.json({
            success: true,
            agentState: {
                emotion: result.emotion,
                intent: result.intent,
                personality: result.personality,
                mood: result.mood,
                contextStats: result.contextStats
            },
            providerPayload: responsePayload,
            availableTools: result.tools.map(t => ({
                id: t.id,
                name: t.name,
                requiresPermission: t.requiresPermission
            }))
        });

    } catch (error) {
        console.error('Error en /api/ai/chat:', error);
        res.status(500).json({ error: 'Error procesando mensaje' });
    }
});

/**
 * POST /api/ai/tool/execute
 * Ejecuta una herramienta
 */
router.post('/tool/execute', async (req, res) => {
    try {
        const { toolId, params } = req.body;
        const sessionId = req.headers['x-session-id'] || 'default';

        const agent = agents.get(sessionId);
        if (!agent) {
            return res.status(404).json({ error: 'Sesión no encontrada' });
        }

        // Verificar permisos
        const permissionCheck = agent.permissions.canExecuteTool(sessionId, toolId);
        if (!permissionCheck.allowed) {
            return res.status(403).json({ error: permissionCheck.reason });
        }

        // Verificar si requiere confirmación
        if (permissionCheck.requiresConfirmation) {
            const { DANGEROUS_COMMANDS } = require('../config/permissions');
            const isDangerous = toolId === 'execute_command' &&
                DANGEROUS_COMMANDS.some(dc => (params.command || '').toLowerCase().includes(dc));

            if (isDangerous) {
                const token = agent.permissions.requestConfirmation(sessionId, toolId, params);
                return res.json({
                    requiresConfirmation: true,
                    confirmationToken: token,
                    message: `¿Confirmar ejecución de comando peligroso?`,
                    details: params
                });
            }
        }

        // Ejecutar herramienta
        const result = await toolExecutor.execute(toolId, params);

        // Registrar en el agente
        agent.recordResponse(`Ejecutado: ${toolId}`, [{ toolId, ...result }]);

        res.json({
            success: result.success,
            result,
            toolId
        });

    } catch (error) {
        console.error('Error en /api/ai/tool/execute:', error);
        res.status(500).json({ error: 'Error ejecutando herramienta' });
    }
});

/**
 * POST /api/ai/tool/confirm
 * Confirma una acción pendiente
 */
router.post('/tool/confirm', (req, res) => {
    try {
        const { token } = req.body;
        const sessionId = req.headers['x-session-id'] || 'default';

        const agent = agents.get(sessionId);
        if (!agent) {
            return res.status(404).json({ error: 'Sesión no encontrada' });
        }

        const { confirmed, confirmation } = agent.permissions.confirmAction(sessionId, token);

        if (!confirmed) {
            return res.status(400).json({ error: 'Confirmación inválida o expirada' });
        }

        res.json({
            success: true,
            confirmation
        });

    } catch (error) {
        console.error('Error en /api/ai/tool/confirm:', error);
        res.status(500).json({ error: 'Error confirmando acción' });
    }
});

/**
 * POST /api/ai/personality
 * Cambia la personalidad del agente
 */
router.post('/personality', (req, res) => {
    try {
        const { personality } = req.body;
        const sessionId = req.headers['x-session-id'] || 'default';

        const agent = agents.get(sessionId);
        if (!agent) {
            return res.status(404).json({ error: 'Sesión no encontrada' });
        }

        agent.setPersonality(personality);

        res.json({
            success: true,
            personality: agent.personalityId
        });

    } catch (error) {
        console.error('Error en /api/ai/personality:', error);
        res.status(500).json({ error: 'Error cambiando personalidad' });
    }
});

/**
 * POST /api/ai/reset
 * Resetea el estado del agente
 */
router.post('/reset', (req, res) => {
    try {
        const sessionId = req.headers['x-session-id'] || 'default';

        const agent = agents.get(sessionId);
        if (agent) {
            agent.reset();
            agents.delete(sessionId);
        }

        res.json({ success: true, message: 'Agente reseteado' });

    } catch (error) {
        console.error('Error en /api/ai/reset:', error);
        res.status(500).json({ error: 'Error reseteando agente' });
    }
});

/**
 * GET /api/ai/tools
 * Lista herramientas disponibles
 */
router.get('/tools', (req, res) => {
    const { listTools } = require('../config/tools');
    res.json(listTools());
});

/**
 * GET /api/ai/personalities
 * Lista personalidades disponibles
 */
router.get('/personalities', (req, res) => {
    res.json(listPersonalities());
});

module.exports = router;
