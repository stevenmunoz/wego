# WeGo - Sistema de Diseño y Guía de Marca

**"Seguro para ti, cómodo para tu mascota"**

---

## Introducción

WeGo es una plataforma de servicios de transporte que ofrece soluciones para personas, mascotas y adultos mayores con necesidades especiales. Este documento define las directrices de marca y sistema de diseño para la plataforma interna de gestión y control.

---

## 1. Logo

### Versiones del Logo

| Versión | Uso | Archivo |
|---------|-----|---------|
| Vertical | Espacios cuadrados, splash screens | `assets/logo-vertical.png` |
| Horizontal | Headers, documentos, formatos horizontales | `assets/logo-horizontal.png` |

### Elementos del Logo

- **Ícono del auto**: Líneas redondeadas y amigables que transmiten movimiento y confianza
- **Corazón coral**: Representa el cuidado, amor y dedicación hacia pasajeros y mascotas
- **Tipografía**: Geométrica, moderna y accesible

### Área de Respeto

Mantener un espacio mínimo alrededor del logo equivalente a la altura de la "o" en "WeGo".

### Usos Incorrectos

- No estirar o distorsionar
- No cambiar los colores del logo
- No colocar sobre fondos que dificulten la legibilidad
- No agregar efectos como sombras o gradientes

---

## 2. Paleta de Colores

### Colores Primarios de Marca

#### Navy (Del logo)
| Token | Hex | Uso |
|-------|-----|-----|
| `--color-primary-800` | `#1E2A3A` | Color principal del texto y elementos |
| `--color-primary-700` | `#2C3E50` | Hover states |
| `--color-primary-600` | `#34495E` | Elementos secundarios |

#### Coral/Rosa (Del corazón)
| Token | Hex | Uso |
|-------|-----|-----|
| `--color-accent-600` | `#F05365` | CTAs principales, elementos destacados |
| `--color-accent-500` | `#F47585` | Hover states |
| `--color-accent-100` | `#FEF0F2` | Fondos sutiles |

### Colores Semánticos

| Estado | Color | Uso en WeGo |
|--------|-------|-------------|
| Éxito | `#22C55E` | Viajes completados, pagos confirmados |
| Advertencia | `#EAB308` | Viajes pendientes, comisiones por pagar |
| Error | `#EF4444` | Viajes cancelados, errores del sistema |
| Info | `#0EA5E9` | Notificaciones, viajes en curso |

### Colores por Tipo de Servicio

| Servicio | Color | Token |
|----------|-------|-------|
| Estándar | Navy | `--service-standard` |
| Mascotas | Coral | `--service-pets` |
| Adultos mayores | Azul | `--service-senior` |
| Necesidades especiales | Amarillo | `--service-special` |

---

## 3. Tipografía

### Familias Tipográficas

```css
/* Títulos y elementos destacados */
font-family: 'Plus Jakarta Sans', sans-serif;

/* Cuerpo de texto y UI */
font-family: 'Inter', sans-serif;

/* Datos numéricos y financieros */
font-family: 'JetBrains Mono', monospace;
```

### Escala Tipográfica

| Estilo | Tamaño | Peso | Uso |
|--------|--------|------|-----|
| Heading 1 | 36px | Bold | Títulos de página |
| Heading 2 | 30px | Semibold | Títulos de sección |
| Heading 3 | 24px | Semibold | Títulos de tarjeta |
| Body | 16px | Regular | Texto principal |
| Body Small | 14px | Regular | Texto secundario, tablas |
| Caption | 12px | Regular | Etiquetas, fechas |

### Ejemplos de Uso

```
TÍTULO DE PÁGINA
Panel de Control

TÍTULO DE SECCIÓN
Viajes de Hoy

TEXTO DE TABLA
Juan Pérez • Servicio Premium

DATOS FINANCIEROS
$125.000 COP
```

---

## 4. Espaciado

### Escala de Espaciado (Base: 4px)

| Token | Valor | Uso |
|-------|-------|-----|
| `--space-1` | 4px | Espaciado mínimo |
| `--space-2` | 8px | Entre elementos relacionados |
| `--space-4` | 16px | Padding de componentes |
| `--space-6` | 24px | Espaciado entre secciones |
| `--space-8` | 32px | Márgenes grandes |

### Radios de Borde

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-md` | 6px | Botones, inputs |
| `--radius-lg` | 8px | Tarjetas pequeñas |
| `--radius-xl` | 12px | Tarjetas, modales |
| `--radius-full` | 9999px | Avatares, badges |

---

## 5. Componentes

### Botones

#### Primario (Coral)
- Acciones principales: "Asignar viaje", "Confirmar pago"
- Fondo coral con texto blanco

#### Secundario (Navy)
- Acciones secundarias: "Ver detalles", "Editar"
- Fondo navy con texto blanco

#### Outline
- Acciones terciarias: "Cancelar", "Volver"
- Borde navy sin fondo

#### Estados
- **Hover**: Oscurecer 10%
- **Focus**: Anillo coral translúcido
- **Disabled**: 50% opacidad

### Tarjetas

#### Tarjeta de Viaje
```
┌─────────────────────────────────┐
│ #VJ-2024-001        [Pendiente] │
├─────────────────────────────────┤
│ ● Calle 100 #15-20              │
│ │                               │
│ ● Centro Comercial Andino       │
├─────────────────────────────────┤
│ 🐕 Mascotas          $45.000    │
└─────────────────────────────────┘
```

#### Tarjeta de Estadística
```
┌─────────────────────┐
│  📊                 │
│  Viajes Hoy         │
│  156                │
│  ↑ 12% vs ayer      │
└─────────────────────┘
```

### Tablas

- Headers en mayúsculas, tamaño pequeño
- Filas alternadas para mejor legibilidad
- Hover state para filas clicables
- Datos numéricos alineados a la derecha
- Badges de estado con colores semánticos

### Navegación

#### Sidebar
- Fondo navy oscuro (`#1E2A3A`)
- Items activos con fondo coral
- Íconos + texto en items
- Colapsable a solo íconos

#### Header
- Fondo blanco con borde sutil
- Búsqueda global
- Notificaciones con badge
- Menú de usuario

---

## 6. Voz de Marca (Español)

### Tono

- **Cálido y cercano**: Hablamos como un amigo de confianza
- **Profesional**: Transmitimos seguridad y experiencia
- **Inclusivo**: Consideramos a todos: personas, mascotas, adultos mayores

### Principios de Comunicación

1. **Claridad**: Mensajes directos y fáciles de entender
2. **Empatía**: Reconocemos las necesidades de cada usuario
3. **Acción**: Guiamos hacia el siguiente paso

### Ejemplos de Copy

#### Mensajes de Estado

| Estado | Mensaje |
|--------|---------|
| Viaje asignado | "¡Listo! El viaje ha sido asignado a [Conductor]" |
| En camino | "[Conductor] está en camino. Llegada estimada: 5 min" |
| Completado | "¡Viaje completado! Gracias por confiar en WeGo" |
| Cancelado | "El viaje ha sido cancelado. ¿Necesitas ayuda?" |

#### Mensajes de Vacío

| Sección | Mensaje |
|---------|---------|
| Sin viajes | "No hay viajes pendientes. ¡Buen trabajo!" |
| Sin conductores | "Aún no hay conductores registrados. Agrega el primero." |
| Sin transacciones | "Las transacciones aparecerán aquí cuando haya actividad." |

#### Mensajes de Error

| Error | Mensaje |
|-------|---------|
| Conexión | "Parece que hay problemas de conexión. Intenta de nuevo." |
| Formulario | "Por favor, completa todos los campos requeridos." |
| Permiso | "No tienes permiso para realizar esta acción." |

#### Etiquetas de Servicio

| Servicio | Etiqueta | Descripción |
|----------|----------|-------------|
| Estándar | "Viaje Estándar" | "Transporte cómodo y seguro" |
| Mascotas | "Viaje con Mascota" | "Tu compañero viaja contigo" |
| Adultos mayores | "Viaje Asistido" | "Atención especial incluida" |
| Premium | "Viaje Premium" | "La mejor experiencia" |

### Formato de Números

- **Moneda**: $125.000 COP (punto como separador de miles)
- **Porcentajes**: 12,5% (coma decimal)
- **Fechas**: 15 de diciembre de 2024
- **Horas**: 14:30 (formato 24h)

---

## 7. Iconografía

### Estilo

- Línea simple (2px stroke)
- Esquinas redondeadas
- Consistente con el estilo del logo

### Íconos Principales

| Función | Sugerencia |
|---------|------------|
| Inicio | Casa |
| Viajes | Auto |
| Conductores | Usuario con volante |
| Finanzas | Billete/Moneda |
| Mascotas | Huella de pata |
| Adulto mayor | Usuario con bastón |
| Configuración | Engranaje |

---

## 8. Responsive Design

### Breakpoints

| Nombre | Ancho | Uso |
|--------|-------|-----|
| Mobile | < 640px | Teléfonos |
| Tablet | 640px - 1024px | Tablets |
| Desktop | > 1024px | Escritorio |

### Adaptaciones

- **Mobile**: Sidebar oculto, navegación inferior
- **Tablet**: Sidebar colapsado, contenido en 1-2 columnas
- **Desktop**: Sidebar completo, contenido en múltiples columnas

---

## 9. Accesibilidad

### Contraste

- Texto normal: mínimo 4.5:1
- Texto grande: mínimo 3:1
- Elementos interactivos: claramente diferenciados

### Focus States

- Todos los elementos interactivos tienen estado de focus visible
- Anillo coral (`--ring-focus`) para indicar enfoque

### Etiquetas

- Todos los inputs tienen labels asociados
- Íconos tienen texto alternativo
- Botones tienen texto descriptivo

---

## 10. Archivos del Sistema

```
design-system/
├── assets/
│   ├── logo-vertical.png
│   └── logo-horizontal.png
├── tokens/
│   ├── colors.css
│   ├── typography.css
│   └── spacing.css
├── components/
│   ├── buttons.css
│   ├── forms.css
│   ├── cards.css
│   ├── tables.css
│   └── navigation.css
└── BRAND_GUIDELINES.md
```

---

## Contacto

Para preguntas sobre la marca o el sistema de diseño, contactar al equipo de diseño de WeGo.

---

*Última actualización: Diciembre 2024*
