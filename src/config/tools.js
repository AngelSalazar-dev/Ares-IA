/**
 * Tools Configuration
 * Define las herramientas disponibles para Ares
 */

const TOOLS = [
    {
        id: 'execute_command',
        name: 'Ejecutar Comando',
        description: 'Ejecuta un comando en la terminal del sistema',
        category: 'system',
        dangerLevel: 'high',
        requiresPermission: 'command:execute',
        parameters: {
            command: {
                type: 'string',
                required: true,
                description: 'Comando a ejecutar'
            }
        },
        examples: ['dir', 'ls -la', 'npm install']
    },
    {
        id: 'open_application',
        name: 'Abrir Aplicación',
        description: 'Abre una aplicación instalada en el sistema',
        category: 'system',
        dangerLevel: 'low',
        requiresPermission: 'system:apps',
        parameters: {
            appName: {
                type: 'string',
                required: true,
                description: 'Nombre de la aplicación'
            }
        },
        examples: ['notepad', 'chrome', 'vscode']
    },
    {
        id: 'system_lock',
        name: 'Bloquear Pantalla',
        description: 'Bloquea la pantalla del usuario',
        category: 'system',
        dangerLevel: 'medium',
        requiresPermission: 'system:lock',
        parameters: {}
    },
    {
        id: 'system_volume',
        name: 'Control de Volumen',
        description: 'Ajusta el volumen del sistema',
        category: 'system',
        dangerLevel: 'low',
        requiresPermission: 'system:volume',
        parameters: {
            action: {
                type: 'string',
                required: true,
                enum: ['up', 'down', 'mute', 'unmute', 'set'],
                description: 'Acción de volumen'
            },
            level: {
                type: 'number',
                required: false,
                description: 'Nivel de volumen (0-100) solo para acción "set"'
            }
        },
        examples: ['up', 'down', 'mute', 'set 50']
    },
    {
        id: 'system_brightness',
        name: 'Control de Brillo',
        description: 'Ajusta el brillo de la pantalla',
        category: 'system',
        dangerLevel: 'low',
        requiresPermission: 'system:brightness',
        parameters: {
            level: {
                type: 'number',
                required: true,
                description: 'Nivel de brillo (0-100)'
            }
        },
        examples: ['50', '100', '0']
    },
    {
        id: 'read_file',
        name: 'Leer Archivo',
        description: 'Lee el contenido de un archivo',
        category: 'files',
        dangerLevel: 'low',
        requiresPermission: 'files:read',
        parameters: {
            path: {
                type: 'string',
                required: true,
                description: 'Ruta del archivo'
            }
        },
        examples: ['C:\\Users\\test.txt', '/home/user/config.json']
    },
    {
        id: 'write_file',
        name: 'Escribir Archivo',
        description: 'Escribe contenido en un archivo (crea o sobreescribe)',
        category: 'files',
        dangerLevel: 'high',
        requiresPermission: 'files:write',
        parameters: {
            path: {
                type: 'string',
                required: true,
                description: 'Ruta del archivo'
            },
            content: {
                type: 'string',
                required: true,
                description: 'Contenido a escribir'
            }
        }
    },
    {
        id: 'list_directory',
        name: 'Listar Directorio',
        description: 'Lista el contenido de un directorio',
        category: 'files',
        dangerLevel: 'low',
        requiresPermission: 'files:read',
        parameters: {
            path: {
                type: 'string',
                required: false,
                description: 'Ruta del directorio (default: directorio actual)'
            }
        },
        examples: ['.', 'C:\\Users', '/home']
    },
    {
        id: 'send_telegram',
        name: 'Enviar Mensaje Telegram',
        description: 'Envía un mensaje a través de Telegram',
        category: 'communication',
        dangerLevel: 'low',
        requiresPermission: 'comms:telegram',
        parameters: {
            message: {
                type: 'string',
                required: true,
                description: 'Mensaje a enviar'
            },
            chatId: {
                type: 'string',
                required: false,
                description: 'ID del chat (default: chat configurado)'
            }
        }
    },
    {
        id: 'get_system_info',
        name: 'Información del Sistema',
        description: 'Obtiene información del sistema operativo',
        category: 'info',
        dangerLevel: 'low',
        requiresPermission: 'info:system',
        parameters: {
            infoType: {
                type: 'string',
                required: false,
                enum: ['all', 'cpu', 'memory', 'disk', 'network'],
                description: 'Tipo de información (default: all)'
            }
        },
        examples: ['all', 'cpu', 'memory']
    },
    {
        id: 'get_ip',
        name: 'Obtener IP',
        description: 'Obtiene la dirección IP del sistema',
        category: 'info',
        dangerLevel: 'low',
        requiresPermission: 'info:network',
        parameters: {}
    },
    {
        id: 'capture_screen',
        name: 'Capturar Pantalla',
        description: 'Captura una imagen de la pantalla actual',
        category: 'media',
        dangerLevel: 'low',
        requiresPermission: 'media:screen',
        parameters: {}
    },
    {
        id: 'toggle_camera',
        name: 'Control de Cámara',
        description: 'Activa o desactiva la cámara',
        category: 'media',
        dangerLevel: 'medium',
        requiresPermission: 'media:camera',
        parameters: {
            action: {
                type: 'string',
                required: true,
                enum: ['on', 'off', 'status'],
                description: 'Acción de la cámara'
            }
        }
    }
];

/**
 * Obtiene una herramienta por su ID
 * @param {string} toolId - ID de la herramienta
 * @returns {Object|null}
 */
function getTool(toolId) {
    return TOOLS.find(t => t.id === toolId) || null;
}

/**
 * Lista todas las herramientas disponibles
 * @returns {Array}
 */
function listTools() {
    return TOOLS.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        dangerLevel: t.dangerLevel
    }));
}

/**
 * Obtiene herramientas por categoría
 * @param {string} category
 * @returns {Array}
 */
function getToolsByCategory(category) {
    return TOOLS.filter(t => t.category === category);
}

/**
 * Convierte las herramientas al formato OpenAI function calling
 * @returns {Array}
 */
function toOpenAIFunctions() {
    return TOOLS.map(tool => ({
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

module.exports = {
    TOOLS,
    getTool,
    listTools,
    getToolsByCategory,
    toOpenAIFunctions
};
