# ADR-001: Separación entre Supabase Auth y la identidad interna de Django

## Estado

Propuesto.

## Fecha

2026-11-09

## Contexto

El sistema nuam utiliza Django REST Framework como backend y Supabase como plataforma de PostgreSQL y autenticación.

Supabase Auth será responsable de:

- registro de credenciales;
- autenticación por correo y contraseña;
- recuperación de acceso;
- emisión de tokens JWT;
- identificación externa mediante el claim `sub`.

La plataforma necesita además conservar información interna de negocio, como:

- RUT;
- rol;
- corredora;
- estado;
- permisos operacionales;
- trazabilidad.

Estos datos no deben almacenarse como claims controlados por el frontend ni duplicar las contraseñas gestionadas por Supabase Auth.

## Problema

Django incluye un sistema de autenticación interno basado en `django.contrib.auth`, el cual puede crear tablas como `auth_user`.

Utilizar simultáneamente las credenciales de Supabase Auth y las credenciales de Django produciría:

- dos fuentes de autenticación;
- contraseñas desincronizadas;
- recuperación de acceso duplicada;
- mayor superficie de ataque;
- ambigüedad sobre quién emite y valida los tokens.

## Decisión

Supabase Auth será la única fuente oficial de autenticación de usuarios.

Django REST Framework:

1. recibirá el JWT emitido por Supabase Auth;
2. validará su firma y claims obligatorios;
3. utilizará el claim `sub` como identificador externo;
4. consultará el perfil interno mediante `auth_user_id`;
5. aplicará autorización RBAC según los datos almacenados en PostgreSQL.

La tabla interna `TB_USUARIOS` no almacenará:

- contraseña;
- password_hash;
- tokens;
- secretos;
- claves de recuperación.

La existencia eventual de tablas internas de `django.contrib.auth` se considerará infraestructura técnica del framework y no fuente de identidad del negocio.

No se utilizará `createsuperuser` como mecanismo para crear usuarios operacionales de nuam.

## Perfil interno propuesto

`TB_USUARIOS` contendrá como mínimo:

- `id_usuario`;
- `auth_user_id`;
- `rut`;
- `email`;
- `id_rol`;
- `id_corredora`;
- `estado`;
- `created_at`;
- `updated_at`.

`auth_user_id` será único y permitirá relacionar un perfil interno con un usuario de Supabase Auth.

## Controles de seguridad

- La `service_role_key` nunca se enviará al frontend.
- React no determinará el rol autorizado.
- Django verificará el estado del usuario en cada operación protegida.
- Los permisos RBAC se aplicarán en el backend.
- Los errores de autenticación no expondrán tokens ni configuraciones.
- Los cambios de rol generarán eventos de auditoría.
- Las contraseñas serán administradas exclusivamente por Supabase Auth.

## Consecuencias positivas

- Existe una única fuente de credenciales.
- Los datos del dominio permanecen normalizados.
- Los roles pueden evolucionar sin modificar las credenciales.
- El backend conserva control sobre la autorización.
- Se reduce la duplicación de responsabilidades.

## Consecuencias negativas

- Django dependerá de la disponibilidad y configuración de Supabase Auth.
- Será necesario implementar una clase de autenticación JWT personalizada.
- Deberá mantenerse sincronizado el estado entre `auth.users` y `TB_USUARIOS`.
- Las tablas internas de Django deberán documentarse para evitar confusión.

## Alternativas descartadas

### Autenticación exclusiva con Django

Descartada porque contradice la arquitectura aprobada basada en Supabase Auth.

### Duplicar contraseñas en TB_USUARIOS

Descartada por riesgo de desincronización, aumento de superficie de ataque y duplicación de credenciales.

### Confiar en el rol enviado por React

Descartada porque el cliente puede ser manipulado y no constituye una fuente segura de autorización.

## Validación pendiente

Antes de ejecutar migraciones remotas se debe confirmar:

- qué aplicaciones internas de Django permanecerán habilitadas;
- qué tablas técnicas serán creadas;
- cómo se validará el JWT de Supabase;
- cómo se creará el perfil interno inicial;
- cómo se bloqueará un usuario;
- cómo se sincronizarán cambios relevantes.