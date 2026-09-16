# Plan: ARES como Agente de IA
# Comportamiento + Capacidades + Seguridad

---

## PARTE 1: SISTEMA COMPORTAMENTAL

### 1.1 Detección de Emociones (src/config/emotions.js)

Analiza el texto del usuario y detecta:
- Emoción dominante (happy, sad, angry, frustrated, anxious, excited, curious, tired)
- Intención (conversacional, técnica, comando)
- Intensidad (0-1)

### 1.2 Personalidades (src/config/personalities.js)

7 modos con system prompts diferenciados:
- default, jarvis, casual, analitico, directo, didactico, creativo

### 1.3 Mood de Ares (src/config/ares-mood.js)

Estado emocional que cambia según la conversación:
- energy (0.3-1.0), empathy (0-1), patience (0.5-1.0)

### 1.4 Gestión de Contexto (src/config/context.js)

Ventana de 32K tokens con resumen automático.

---

## PARTE 2: SISTEMA DE AGENTE (HERRAMIENTAS)

### 2.1 Definición de Herramientas

Cada herramienta tiene: nombre, descripción, parámetros, permisos.

```javascript
// src/config/tools.js

const TOOLS = {
  // === COMANDOS DEL SISTEMA ===
  execute_command: {
    name: "Ejecutar Comando",
    description: "Ejecuta un comando en la terminal del sistema",
    parameters: {
      command: { type: "string", required: true, description: "Comando a ejecutar" }
    },
    permissions: ["command:execute"],
    dangerLevel: "high", // Requiere confirmación
    examples: ["npm install", "git status", "dir"]
  },

  open_application: {
    name: "Abrir Aplicación",
    description: "Abre una aplicación del sistema",
    parameters: {
      app: { type: "string", required: true, description: "Nombre de la aplicación" }
    },
    permissions: ["system:apps"],
    dangerLevel: "low",
    examples: ["chrome", "spotify", "notepad"]
  },

  // === CONTROL DEL SISTEMA ===
  system_lock: {
    name: "Bloquear Pantalla",
    description: "Bloquea la pantalla del equipo",
    parameters: {},
    permissions: ["system:lock"],
    dangerLevel: "medium",
    requiresConfirmation: true
  },

  system_volume: {
    name: "Control de Volumen",
    description: "Ajusta el volumen del sistema",
    parameters: {
      action: { type: "string", enum: ["up", "down", "mute", "set"], required: true },
      level: { type: "number", description: "Nivel 0-100 (solo para 'set')" }
    },
    permissions: ["system:volume"],
    dangerLevel: "low"
  },

  system_brightness: {
    name: "Control de Brillo",
    description: "Ajusta el brillo de la pantalla",
    parameters: {
      action: { type: "string", enum: ["up", "down", "set"], required: true },
      level: { type: "number", description: "Nivel 0-100 (solo para 'set')" }
    },
    permissions: ["system:brightness"],
    dangerLevel: "low"
  },

  // === ARCHIVOS ===
  read_file: {
    name: "Leer Archivo",
    description: "Lee el contenido de un archivo",
    parameters: {
      path: { type: "string", required: true, description: "Ruta del archivo" }
    },
    permissions: ["files:read"],
    dangerLevel: "low",
    allowedPaths: ["./", "../"], // Solo relativas
    blockedPaths: ["node_modules", ".git", ".env"]
  },

  write_file: {
    name: "Escribir Archivo",
    description: "Escribe contenido en un archivo",
    parameters: {
      path: { type: "string", required: true },
      content: { type: "string", required: true }
    },
    permissions: ["files:write"],
    dangerLevel: "high",
    requiresConfirmation: true,
    allowedPaths: ["./", "data/", "logs/"],
    blockedPaths: [".env", "package.json", "node_modules"]
  },

  list_directory: {
    name: "Listar Directorio",
    description: "Muestra el contenido de un directorio",
    parameters: {
      path: { type: "string", default: "." }
    },
    permissions: ["files:read"],
    dangerLevel: "low"
  },

  // === COMUNICACIÓN ===
  send_telegram: {
    name: "Enviar Telegram",
    description: "Envía un mensaje por Telegram",
    parameters: {
      message: { type: "string", required: true }
    },
    permissions: ["comms:telegram"],
    dangerLevel: "low"
  },

  // === INFORMACIÓN ===
  get_system_info: {
    name: "Info del Sistema",
    description: "Obtiene información del sistema (OS, CPU, RAM)",
    parameters: {},
    permissions: ["info:system"],
    dangerLevel: "low"
  },

  get_ip: {
    name: "Obtener IP",
    description: "Obtiene la dirección IP pública",
    parameters: {},
    permissions: ["info:network"],
    dangerLevel: "low"
  },

  // === IA ===
  ai_chat: {
    name: "Chat con IA",
    description: "Envía un mensaje a la IA y obtiene respuesta",
    parameters: {
      message: { type: "string", required: true },
      personality: { type: "string", default: "default" }
    },
    permissions: ["ai:chat"],
    dangerLevel: "low"
  },

  // === MULTIMEDIA ===
  capture_screen: {
    name: "Capturar Pantalla",
    description: "Toma una captura de pantalla",
    parameters: {},
    permissions: ["media:screen"],
    dangerLevel: "low"
  },

  toggle_camera: {
    name: "Activar/Desactivar Cámara",
    description: "Controla la cámara del sistema",
    parameters: {
      action: { type: "string", enum: ["on", "off"], required: true }
    },
    permissions: ["media:camera"],
    dangerLevel: "medium"
  }
};
```

### 2.2 Sistema de Permisos

```javascript
// src/config/permissions.js

const PERMISSION_LEVELS = {
  // Nivel 0: Sin restricciones
  public: [
    "ai:chat",
    "info:system",
    "info:network"
  ],

  // Nivel 1: Operaciones básicas (usuario local)
  user: [
    "command:execute",
    "system:apps",
    "system:volume",
    "system:brightness",
    "files:read",
    "media:screen",
    "comms:telegram"
  ],

  // Nivel 2: Operaciones sensibles (requiere auth)
  privileged: [
    "system:lock",
    "files:write",
    "media:camera"
  ],

  // Nivel 3: Operaciones críticas (requiere confirmación explícita)
  critical: [
    "system:shutdown",
    "system:restart",
    "files:delete"
  ]
};

// API Key o token para operaciones privileged+
const AUTH_CONFIG = {
  requireAuthFor: ["privileged", "critical"],
  sessionTimeout: 3600000, // 1 hora
  maxAttempts: 3
};
```

### 2.3 Detección de Intención y Routing

```javascript
// src/config/agent.js

const INTENT_PATTERNS = {
  // Comandos del sistema
  command: {
    patterns: [
      /^(ejecuta|corre|run|executa)\s+(.+)$/i,
      /^(abre|abrir|open)\s+(.+)$/i,
      /^(instala|install)\s+(.+)$/i
    ],
    tool: "execute_command",
    extractParams: (match) => ({ command: match[2] })
  },

  // Control del sistema
  volume: {
    patterns: [
      /^(sube|baja|silencia|subir|bajar)\s+(el\s+)?volumen/i,
      /^(volumen)\s+(al?\s+)?(\d+)/i
    ],
    tool: "system_volume",
    extractParams: (match) => {
      if (match[1].match(/sube|subir/)) return { action: "up" };
      if (match[1].match(/baja|bajar/)) return { action: "down" };
      if (match[1].match(/silencia/)) return { action: "mute" };
      return { action: "set", level: parseInt(match[3]) };
    }
  },

  lock: {
    patterns: [
      /^(bloquea|lock|bloquear)\s+(pantalla|screen|pc)/i
    ],
    tool: "system_lock",
    requiresConfirmation: true
  },

  // Archivos
  list_files: {
    patterns: [
      /^(lista|list|muéstra|show)\s+(archivos|files|carpeta|folder)/i,
      /^(qué\s+)?hay\s+en\s+(.+)?/i
    ],
    tool: "list_directory",
    extractParams: (match) => ({ path: match[2] || "." })
  },

  // Información
  system_info: {
    patterns: [
      /^(info|información|estado|status)\s+(del?\s+)?(sistema|system|pc|equipo)/i,
      /^(cuánta|qué)\s+(ram|cpu|memoria)/i
    ],
    tool: "get_system_info"
  },

  ip: {
    patterns: [
      /^(cuál|cual)\s+(es\s+)?(mi?\s+)?(ip|dirección)/i
    ],
    tool: "get_ip"
  },

  // Chat con IA (fallback)
  chat: {
    patterns: [/.*/], // Cualquier otro mensaje
    tool: "ai_chat",
    extractParams: (match, message) => ({ message })
  }
};
```

### 2.4 Ejecutor de Herramientas

```javascript
// src/services/toolExecutor.js

const { TOOLS } = require('../config/tools');
const { PERMISSION_LEVELS } = require('../config/permissions');

class ToolExecutor {
  constructor() {
    this.authenticated = false;
    this.authLevel = 'public';
  }

  // Detectar intención del usuario
  detectIntent(message) {
    for (const [intent, config] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of config.patterns) {
        const match = message.match(pattern);
        if (match) {
          return {
            intent,
            tool: config.tool,
            params: config.extractParams 
              ? config.extractParams(match, message) 
              : {},
            requiresConfirmation: config.requiresConfirmation || false
          };
        }
      }
    }
    return null;
  }

  // Verificar permisos
  hasPermission(toolName) {
    const tool = TOOLS[toolName];
    if (!tool) return false;

    for (const perm of tool.permissions) {
      const [category] = perm.split(':');
      const level = this.getPermissionLevel(category);
      if (level < this.getRequiredLevel(tool)) {
        return false;
      }
    }
    return true;
  }

  // Ejecutar herramienta
  async execute(toolName, params) {
    const tool = TOOLS[toolName];
    if (!tool) throw new Error(`Herramienta desconocida: ${toolName}`);

    // Verificar permisos
    if (!this.hasPermission(toolName)) {
      throw new Error(`Sin permisos para: ${tool.name}`);
    }

    // Verificar paths permitidos (si aplica)
    if (tool.allowedPaths && params.path) {
      if (!this.isPathAllowed(params.path, tool)) {
        throw new Error(`Path no permitido: ${params.path}`);
      }
    }

    // Ejecutar
    return await this.runTool(toolName, params);
  }

  isPathAllowed(path, tool) {
    const normalizedPath = path.replace(/\\/g, '/');
    
    // Verificar blocked paths
    if (tool.blockedPaths) {
      for (const blocked of tool.blockedPaths) {
        if (normalizedPath.includes(blocked)) return false;
      }
    }

    // Verificar allowed paths
    if (tool.allowedPaths) {
      return tool.allowedPaths.some(allowed => 
        normalizedPath.startsWith(allowed)
      );
    }

    return true;
  }

  async runTool(toolName, params) {
    const { exec } = require('child_process');
    
    switch (toolName) {
      case 'execute_command':
        return await this.execCommand(params.command);
      case 'open_application':
        return await this.openApp(params.app);
      case 'system_lock':
        return await this.lockSystem();
      case 'system_volume':
        return await this.setVolume(params);
      case 'get_system_info':
        return this.getSystemInfo();
      case 'get_ip':
        return await this.getIP();
      case 'list_directory':
        return this.listDirectory(params.path);
      default:
        throw new Error(`Tool not implemented: ${toolName}`);
    }
  }

  // ... implementaciones individuales
}
```

---

## PARTE 3: INTEGRACIÓN CON CHAT

### 3.1 Flujo de un Mensaje

```
Usuario escribe → Detección de emoción → Detección de intención
                                           ↓
                                    ¿Es comando/herramienta?
                                      ↓ SI            ↓ NO
                              Verificar permisos    Chat con IA
                                      ↓                   ↓
                              Ejecutar herramienta   Respuesta con
                                      ↓              prefijo emocional
                              Formatear respuesta         ↓
                                      ↓            Guardar en DB
                              Responder al usuario
```

### 3.2 Endpoint Unificado

```javascript
// POST /api/ai/action
{
  "message": "abre chrome",
  "sessionId": "abc123",
  "personality": "default"
}

// Response
{
  "type": "action",
  "tool": "open_application",
  "params": { "app": "chrome" },
  "result": { "success": true },
  "emotion": "neutral",
  "response": "Abriendo Chrome..."
}
```

---

## PARTE 4: ARCHIVOS A CREAR

| Archivo | Descripción |
|---------|-------------|
| `src/config/emotions.js` | Detección de emociones |
| `src/config/personalities.js` | 7 personalidades |
| `src/config/ares-mood.js` | Estado emocional de Ares |
| `src/config/context.js` | Gestión de contexto/tokens |
| `src/config/tools.js` | Definición de herramientas |
| `src/config/permissions.js` | Sistema de permisos |
| `src/config/agent.js` | Detección de intención |
| `src/services/toolExecutor.js` | Ejecutor de herramientas |
| `src/routes/ai.js` | Endpoint de chat/acciones |
| `tests/emotions.test.js` | Tests de emociones |
| `tests/agent.test.js` | Tests de agente |

---

## PARTE 5: TESTS

### Tests de Emociones
- Detectar happy, sad, angry, frustrated, etc.
- Detectar intención conversacional vs técnica
- Detectar comandos

### Tests de Agente
- Detectar intención "abre chrome"
- Detectar intención "sube volumen"
- Verificar permisos
- Rechazar comandos peligrosos

### Tests de Personalidades
- Verificar que cada personalidad tiene systemPrompt
- Verificar que getPersonality() retorna la correcta

---

## PARTE 6: ORDEN DE IMPLEMENTACIÓN

1. emotions.js + tests
2. personalities.js
3. ares-mood.js
4. context.js
5. tools.js + permissions.js
6. agent.js (detección de intención)
7. toolExecutor.js + tests
8. routes/ai.js (endpoint unificado)
9. Integrar en server.js
10. Commit final

---

¿Apruebas este plan completo?
