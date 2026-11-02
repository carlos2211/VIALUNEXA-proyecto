# VIALUNEXA

Plataforma web (mobile-first) de reservas de traslados privados y servicios de conductor.
Proyecto del Grupo 19 (Alberto Diaz, Carlos Orrego y Enzo Meschi) para Taller Aplicado de Software (TSY2201), Duoc UC.

> **Estado actual:** prototipo de frontend. Los datos y las sesiones se guardan en el navegador (localStorage).
> La API REST (Java + Spring Boot), la base de datos (Oracle Cloud) y el despliegue en AWS se agregan en las semanas 5 a 7.

## Requisitos

- [Node.js](https://nodejs.org/) **22 LTS** o superior (mínimo 20.19 o 22.12, por Vite 8). Incluye npm.
- Git.

Verifica tu versión con `node -v`.

## Cómo correrlo en desarrollo

```bash
git clone https://github.com/carlos2211/VIALUNEXA-proyecto.git
cd VIALUNEXA-proyecto
npm ci         # instala las dependencias exactas de package-lock.json
npm run dev    # servidor de desarrollo
```

Abre http://localhost:5173. Los cambios en el código se ven al instante.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run lint` | Análisis estático con oxlint (meta: 0 errores y 0 advertencias) |
| `npm run build` | Verifica los tipos (TypeScript) y genera la versión compilada en `dist/` |
| `npm run preview` | Sirve localmente la versión compilada |

## Cuentas de prueba

| Perfil | Correo | Contraseña |
|---|---|---|
| Administrador | admin@vialunexa.cl | admin123 |
| Conductor | conductor@vialunexa.cl | conductor123 |
| Cliente | cliente@vialunexa.cl | cliente123 |

Solo son cuentas de demostración del prototipo: la autenticación local no es seguridad real.

## Datos del prototipo

Cada navegador tiene sus propios datos: lo que crea un integrante no lo ven los demás.
Para volver al estado inicial, borra los datos del sitio (Chrome: F12 → Application → Storage → *Clear site data*).

## Estructura

```
src/
  views/        Pantallas por perfil (cliente, conductor, administrador)
  components/   Componentes compartidos (reservas, asignación, soporte, fotos)
  context/      Estado de la aplicación: sesión, datos y avisos
  hooks/        Formularios y flota del conductor
  lib/          Cotización, validaciones, constantes y almacenamiento
```

## Forma de trabajo

- Una rama por tarea (`feature/...` o `fix/DEF-###`) y pull request revisado por otro integrante antes de integrar a `main`.
- Una tarea está terminada cuando compila sin errores, pasa `npm run lint`, tiene sus pruebas y fue revisada.
