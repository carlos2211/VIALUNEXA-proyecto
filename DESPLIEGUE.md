# Despliegue continuo de VIALUNEXA

Servidor de avance: cada cambio que se sube a la rama `main` se verifica y se publica solo,
para que el equipo y los docentes vean siempre la última versión.

```
 push a main ──► GitHub Actions (CI) ──► ¿pasa? ──► Render redespliega el servicio que cambió
                 · Frontend: lint + build          vialunexa-web  (contenedor nginx)
                 · API: pruebas (mvn verify)       vialunexa-api  (contenedor Java 21)
                 · Construye ambas imágenes Docker
```

| Servicio | Carpeta | Contenedor | Salud |
|---|---|---|---|
| `vialunexa-web` – frontend React | `/` | `Dockerfile` (Node → nginx) | `/healthz` |
| `vialunexa-api` – API Spring Boot | `/api` | `api/Dockerfile` (Maven → JRE 21) | `/actuator/health` |

Cada servicio se construye, despliega y escala por separado: un cambio solo en `api/` no
redespliega el frontend, y viceversa.

**¿Qué versión está publicada?** El pie de página de la app muestra el commit y la fecha de
compilación, y si la API está en línea. La API responde lo mismo en `/api/version`.

## Puesta en marcha en Render (una sola vez)

1. Crea una cuenta en <https://render.com> con tu usuario de GitHub y autoriza el repositorio
   `VIALUNEXA-proyecto`.
2. En Render: **New → Blueprint**, elige el repositorio y la rama `main`. Render lee `render.yaml`
   y propone los dos servicios.
3. Te pedirá `VITE_GOOGLE_MAPS_KEY`: pega la clave de Google Maps (o déjala vacía para usar
   OpenStreetMap). No se guarda en el repositorio.
4. **Apply**. El primer despliegue tarda unos minutos (la API compila con Maven).
5. Revisa las URLs que asignó Render. Si no son `https://vialunexa-web.onrender.com` y
   `https://vialunexa-api.onrender.com`, actualiza en el panel de Render:
   - en `vialunexa-web`: `VITE_API_URL` = URL real de la API;
   - en `vialunexa-api`: `CORS_ORIGINS` = URL real del frontend.
6. En Google Cloud → Credenciales → tu clave → Restricciones de sitios web, agrega
   `https://vialunexa-web.onrender.com/*` (o la URL real).
7. Comparte la URL del frontend con el equipo y los docentes.

> **Plan gratuito:** los servicios se "duermen" tras unos 15 minutos sin visitas; la primera
> visita después puede tardar cerca de un minuto en responder. Para la presentación, abre la
> app un par de minutos antes.

## Desarrollo local con contenedores

Requiere Docker Desktop.

```bash
# Igual que en producción (frontend en :8080, API en :8081)
docker compose --env-file .env.local up --build

# Desarrollo en vivo: Vite en contenedor con recarga instantánea (:5173) + API (:8081)
docker compose --env-file .env.local --profile dev up api dev
```

Sin Docker, sigue funcionando `npm run dev` (frontend) y, para la API:

```bash
cd api
./mvnw spring-boot:run      # en Windows: mvnw.cmd spring-boot:run (requiere JDK 21)
```

## Endpoints de la API (base)

| Ruta | Descripción |
|---|---|
| `GET /` | Información del servicio |
| `GET /api/version` | Commit desplegado e inicio del servicio |
| `GET /api/tarifas` | Tarifas por modalidad |
| `GET /api/servicios` | Tipos de servicio |
| `GET /actuator/health` | Estado del servicio (lo usan Render y Docker) |

Por ahora los datos son fijos; en las semanas 5 a 7 se conectan a Oracle Database en Oracle Cloud.

## Variables de entorno

| Variable | Servicio | Uso |
|---|---|---|
| `VITE_GOOGLE_MAPS_KEY` | web (al compilar) | Clave de Google Maps (opcional) |
| `VITE_API_URL` | web (al compilar) | URL pública de la API |
| `PORT` | ambos | Puerto (Render lo asigna) |
| `CORS_ORIGINS` | api | Orígenes del frontend permitidos, separados por coma |
| `RENDER_GIT_COMMIT` / `GIT_COMMIT` | ambos | Commit mostrado como versión |
