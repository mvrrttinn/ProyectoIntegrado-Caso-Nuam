# Modelo de identidad y pertenencia organizacional

## 1. Información del documento

| Elemento | Detalle |
|---|---|
| Proyecto | Mantenedor Web Centralizado de Calificaciones Tributarias y Dividendos |
| Organización de referencia | nuam |
| Documento | Modelo de identidad y pertenencia organizacional |
| Versión | 1.0 |
| Estado | Aprobado para implementación inicial |
| Backend | Django REST Framework 5.2 |
| Base de datos relacional | PostgreSQL administrado mediante Supabase |
| Autenticación | Supabase Auth |
| Responsable principal | Martín Tapia |
| Fecha | 2026-11-09 |

---

## 2. Objetivo

Definir el modelo relacional inicial para representar los roles, corredoras y perfiles internos de los usuarios de la plataforma, manteniendo a Supabase Auth como única autoridad de identidad y credenciales.

Este documento toma como línea base el Modelo Entidad Relación elaborado durante la etapa de diseño y registra las correcciones necesarias para que el modelo pueda implementarse de manera segura y consistente con:

- Django REST Framework;
- PostgreSQL;
- Supabase Auth;
- arquitectura híbrida PostgreSQL y MongoDB;
- control de acceso basado en roles;
- trazabilidad;
- normalización;
- seguridad;
- pruebas automatizadas;
- requerimientos funcionales de la plataforma.

La primera implementación abarcará exclusivamente:

- `TB_ROLES`;
- `TB_CORREDORAS`;
- `TB_USUARIOS`.

Las entidades tributarias restantes se implementarán posteriormente, una vez validado el núcleo de identidad y pertenencia organizacional.

---

## 3. Alcance

Este documento define:

1. La interpretación del MER original.
2. Las entidades que se conservarán.
3. Las correcciones necesarias.
4. Las nuevas entidades requeridas.
5. Las claves primarias y foráneas.
6. Los estados permitidos.
7. Las restricciones de integridad.
8. Las reglas de eliminación.
9. Los índices iniciales.
10. La relación lógica con Supabase Auth.
11. La separación entre autenticación y autorización.
12. Los criterios que deberá validar la implementación en Django.
13. La trazabilidad con los casos de uso y la pauta de evaluación.

Este documento no define todavía:

- endpoints de autenticación;
- validación de JWT;
- políticas RLS definitivas;
- modelos de certificados;
- modelos de factores tributarios;
- modelos de lotes;
- modelos de inconsistencias;
- implementación de MongoDB Atlas;
- implementación del patrón Transactional Outbox;
- documentos JSON de auditoría;
- worker de sincronización;
- interfaz React.

---

## 4. Modelo Entidad Relación original

El MER original contiene las siguientes entidades:

- `TB_ROLES`;
- `TB_USUARIOS`;
- `TB_EMISORES`;
- `TB_CERTIFICADOS_DIVIDENDOS`;
- `TB_FACTORES_TRIBUTARIOS`;
- `TB_AUDIT_LOGS`.

Las relaciones representadas son:

```text
TB_ROLES 1 ─── N TB_USUARIOS

TB_EMISORES 1 ─── N TB_CERTIFICADOS_DIVIDENDOS

TB_CERTIFICADOS_DIVIDENDOS 1 ─── N TB_FACTORES_TRIBUTARIOS

TB_CERTIFICADOS_DIVIDENDOS 1 ─── N TB_AUDIT_LOGS
