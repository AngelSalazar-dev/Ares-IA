# Sistema de Iconos - Ares TRON

## ❌ Problema Actual
- Emojis se ven "chafas" y poco profesionales
- No combinan con la estética futurista/TRON
- Diferentes plataformas muestran emojis diferentes

## ✅ Solución: Lucide Icons + Custom SVGs

### Opción 1: Lucide Icons (Recomendada)
- **Peso:** ~2KB por icono
- **Estilo:** Line icons, minimalista
- **Compatible:** React, Vue, vanilla JS
- **URL:** https://lucide.dev

### Opción 2: Phosphor Icons
- **Peso:** ~3KB por icono
- **Estilo:** Flexible (thin, light, bold, fill)
- **URL:** https://phosphoricons.com

### Opción 3: SVGs Customizados
- Total control del diseño
- Estilo TRON exacto
- Más trabajo pero mejor resultado

---

## Paleta de Iconos por Categoría

### Sidebar
| Icono | Lucide Name | Descripción |
|-------|-------------|-------------|
| Logo | `Box` | Cuadrado con línea (como TRON) |
| Chat | `MessageSquare` | Mensaje |
| Nuevo Chat | `Plus` | Cruz |
| Buscar | `Search` | Lupa |
| Config | `Settings` | Engranaje |
| Colapsar | `PanelLeftClose` | Sidebar colapsado |

### Acciones Rápidas
| Icono | Lucide Name | Descripción |
|-------|-------------|-------------|
| Nota | `FileText` | Documento |
| Timer | `Timer` | Cronómetro |
| Tareas | `CheckSquare` | Checkbox |
| Música | `Music` | Nota musical |
| Recordatorio | `Bell` | Campana |

### Chat
| Icono | Lucide Name | Descripción |
|-------|-------------|-------------|
| Enviar | `Send` | Flecha enviar |
| Micrófono | `Mic` | Micrófono |
| Voz | `Volume2` | Altavoz |
| Adjuntar | `Paperclip` | Clip |
| Emoji | `Smile` | Cara (opcional) |

### Estado
| Icono | Lucide Name | Descripción |
|-------|-------------|-------------|
| Online | `Circle` (fill) | Círculo relleno |
| Offline | `Circle` | Círculo vacío |
| Procesando | `Loader` | Spinner |
| Éxito | `CheckCircle` | Círculo check |
| Error | `XCircle` | Círculo X |

### Tareas
| Icono | Lucide Name | Descripción |
|-------|-------------|-------------|
| Pendiente | `Square` | Cuadrado vacío |
| Completada | `CheckSquare` | Cuadrado con check |
| Prioridad Alta | `AlertTriangle` | Triángulo |
| Eliminar | `Trash2` | Basura |

### Modos
| Icono | Lucide Name | Descripción |
|-------|-------------|-------------|
| Trabajo | `Briefcase` | Maletín |
| Relax | `Coffee` | Taza |
| Aprender | `BookOpen` | Libro |
| Creativo | `Palette` | Paleta |
| Código | `Code` | Código |
| Sistema | `Monitor` | Pantalla |

---

## Implementación

### 1. Instalación
```html
<!-- En el <head> del HTML -->
<link rel="stylesheet" href="https://unpkg.com/lucide-static@latest/font/lucide.css">
```

### 2. Uso en HTML
```html
<!-- En vez de: 📝 -->
<i data-lucide="file-text"></i>

<!-- En vez de: ⏰ -->
<i data-lucide="timer"></i>

<!-- En vez de: 📋 -->
<i data-lucide="check-square"></i>
```

### 3. Uso en JavaScript
```javascript
// Inicializar iconos
lucide.createIcons();

// Crear icono dinámicamente
const icon = document.createElement('i');
icon.setAttribute('data-lucide', 'send');
document.body.appendChild(icon);
lucide.createIcons();
```

---

## Mapeo de Emojis a Iconos

### Sidebar
| Actual | Nuevo |
|--------|-------|
| 💬 | `<i data-lucide="message-square"></i>` |
| 🔴 | `<i data-lucide="circle" class="fill-red"></i>` |
| ✏️ | `<i data-lucide="pencil"></i>` |
| 🗑️ | `<i data-lucide="trash-2"></i>` |
| ➕ | `<i data-lucide="plus"></i>` |
| 🔍 | `<i data-lucide="search"></i>` |

### Acciones
| Actual | Nuevo |
|--------|-------|
| 📝 | `<i data-lucide="file-text"></i>` |
| ⏰ | `<i data-lucide="timer"></i>` |
| 📋 | `<i data-lucide="check-square"></i>` |
| 🎵 | `<i data-lucide="music"></i>` |
| 🎤 | `<i data-lucide="mic"></i>` |
| 🔊 | `<i data-lucide="volume-2"></i>` |
| 📤 | `<i data-lucide="send"></i>` |

### Estados
| Actual | Nuevo |
|--------|-------|
| ✅ | `<i data-lucide="check-circle" class="text-green"></i>` |
| ❌ | `<i data-lucide="x-circle" class="text-red"></i>` |
| ⏳ | `<i data-lucide="loader" class="spin"></i>` |
| 📌 | `<i data-lucide="pin"></i>` |

---

## Estilos CSS para Iconos

```css
/* Tamaño base */
.lucide {
    width: 18px;
    height: 18px;
    stroke-width: 1.5;
}

/* Colores */
.lucide.text-red { color: #ff1133; }
.lucide.text-cyan { color: #00ffff; }
.lucide.text-green { color: #00ff88; }
.lucide.text-dim { color: #666680; }
.lucide.fill-red { fill: #ff1133; stroke: #ff1133; }

/* Glow effect */
.lucide.glow {
    filter: drop-shadow(0 0 4px #ff1133);
}

/* Spin animation */
.lucide.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `index_gemini.html` | Agregar Lucide CSS, reemplazar emojis |
| `overlay.html` | Lo mismo |
| `public/overlay.html` | Lo mismo |
| `public/overlay-jarvis.html` | Lo mismo |

---

**¿Apruebas usar Lucide Icons? ¿O prefieres SVGs customizados?**
