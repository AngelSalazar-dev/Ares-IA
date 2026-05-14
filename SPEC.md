# SPEC.md - Ares: Control Maestro

## 1. Project Overview

- **Project Name**: Ares
- **Type**: Web Application (IA Assistant)
- **Core Functionality**: Asistente IA con temática rojo/negro para control y gestión del equipo
- **Target Users**: Usuario principal

## 2. UI/UX Specification

### Layout Structure
- **Header**: Logo "Ares" con efectos neón rojo, menú de navegación
- **Main Content**: Área de chat/mensajes con la IA
- **Sidebar**: Panel de herramientas y controles del sistema
- **Footer**: Estado de conexión y controles adicionales

### Responsive Breakpoints
- Mobile: < 768px (sidebar colapsada)
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Visual Design

#### Color Palette
- **Primary (Rojo)**: `#E31C25` (rojo vivo)
- **Secondary (Negro)**: `#0D0D0D` (negro profundo)
- **Accent**: `#FF2D35` (rojo brillante/neón)
- **Background Dark**: `#1A1A1A`
- **Background Light**: `#252525`
- **Text Primary**: `#FFFFFF`
- **Text Secondary**: `#B0B0B0`
- **Border/Glow**: `#FF3333`

#### Typography
- **Font Family**: 'Orbitron' (títulos), 'Rajdhani' (cuerpo)
- **Heading Sizes**: H1: 2.5rem, H2: 2rem, H3: 1.5rem
- **Body Size**: 1rem (16px)
- **Font Weights**: 400, 600, 700

#### Visual Effects
- Efectos neón rojo (box-shadow con glow)
- Transiciones suaves (0.3s ease)
- Animaciones de entrada sutiles
- Fondo con patrón geométrico oscuro sutil

### Components
- **Chat Box**: Mensajes con burbujas rojo/negro
- **Input Field**: Campo de texto con borde rojo neón
- **Buttons**: Botones con efecto glow rojo
- **Cards**: Paneles con bordes sutiles rojos
- **Status Indicator**:LED estados con color rojo/verde

## 3. Functionality Specification

### Core Features
1. **Chat con IA**: Chatbot para interacturar con el usuario
2. **Panel de Control**: Widgets para controlar aspectos del sistema
3. **Gestor de Tareas**: Organización de tareas pendientes
4. **Notas**: Sistema de notas rápidas
5. **Enlaces Rápidos**: Accesos directos configurables

### User Interactions
- Escribir mensajes y enviar
- Click en botones de acción rápida
- Arrastrar y soltar en widgets
- keyboard shortcuts

### Data Handling
- LocalStorage para persistencia de datos
- API de OpenRouter para chat

## 4. Acceptance Criteria
- [ ] Interfaz carga correctamente con temática rojo/negro
- [ ] Efectos neón visibles
- [ ] Chat funcional con respuestas de IA
- [ ] Panel de control visible
- [ ] Responsive en móviles
- [ ] Sin errores en consola