# Digital World VIP — Netlify + Supabase

Proyecto de academia digital con:
- Página pública responsive.
- Membresías Bronce, Oro y Diamante.
- Precios en pesos y USD.
- Botón de compra por WhatsApp.
- Login de alumnos.
- Área privada por membresía.
- Panel administrador.
- Alta de alumnos con correo/contraseña.
- Edición de precios, beneficios, textos, WhatsApp y fundadores.
- Creación de módulos y clases.
- Subida de videos y archivos a Supabase Storage.

## IMPORTANTE
Este ZIP no contiene credenciales reales ni datos bancarios. Debes conectar tu propio proyecto Supabase. La `service_role key` NUNCA debe escribirse en `config.js`.

## 1. Crear Supabase
1. Crea un proyecto en Supabase.
2. Abre SQL Editor y ejecuta completo `supabase/schema.sql`.
3. En Authentication > Users crea manualmente tu primer usuario administrador (correo + contraseña).
4. Copia el UUID del usuario creado.
5. Ejecuta la última sentencia indicada en `schema.sql`, reemplazando UUID, nombre y correo. Así ese usuario se convierte en administrador.

## 2. Editar config.js
En Supabase > Project Settings / API copia:
- Project URL
- Anon key / Publishable key

Reemplaza en `config.js`:
- `REEMPLAZAR_CON_SUPABASE_URL`
- `REEMPLAZAR_CON_SUPABASE_ANON_KEY`

La anon/publishable key puede estar en el frontend; la service_role NO.

## 3. Variables privadas en Netlify
En tu sitio Netlify configura estas variables de entorno:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

La tercera se obtiene en la configuración API de Supabase y debe permanecer secreta.

## 4. Publicar en Netlify
Este proyecto no necesita proceso de compilación para el frontend, pero sí incluye Netlify Functions para crear/editar alumnos de forma segura.

### Opción recomendada: GitHub + Netlify
1. Descomprime este ZIP.
2. Sube la carpeta completa a un repositorio GitHub.
3. En Netlify: Add new project > Import an existing project.
4. Selecciona el repositorio.
5. Netlify leerá `netlify.toml` y desplegará el sitio y las Functions.
6. Agrega las variables de entorno indicadas arriba y redeploy.

### Opción con Netlify CLI
Desde la carpeta del proyecto:
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod --dir=. --functions=netlify/functions
```

La subida simple por “arrastrar carpeta/ZIP” sirve para archivos estáticos, pero para este proyecto conviene Git o Netlify CLI porque la creación segura de alumnos depende de Netlify Functions.

## 5. Primer acceso
- Entra a `https://TU-SITIO.netlify.app/login.html`
- Usa el correo/contraseña del administrador creado en Supabase.
- Desde el panel configura:
  - precios;
  - número WhatsApp;
  - beneficios;
  - fundadores;
  - módulos y clases;
  - alumnos.

## WhatsApp
Guarda el número con código de país y solo dígitos. Ejemplo de formato: `521234567890`.

## Moneda en pesos
El precio local se muestra de forma genérica como `pesos` para no asumir un país. El precio internacional se muestra en USD. Si luego quieres usar un código concreto como MXN, COP, ARS o CLP, se puede configurar.

## Videos y archivos
Los archivos privados se guardan en el bucket `academy-files`. Las políticas RLS incluidas permiten que un alumno acceda solamente a archivos ubicados dentro de la carpeta de su membresía (`bronce/`, `oro/` o `diamante/`).

Para bibliotecas de video muy grandes conviene considerar un servicio especializado de streaming en una fase posterior.
