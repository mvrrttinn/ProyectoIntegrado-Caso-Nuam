# Modelo regional de identidad y pertenencia organizacional

## 1. Información del documento

| Elemento | Detalle |
|---|---|
| Proyecto | Mantenedor Web Centralizado de Calificaciones Tributarias y Dividendos |
| Organización de referencia | nuam |
| Alcance geográfico | Chile, Perú y Colombia |
| Documento | Modelo regional de identidad y pertenencia organizacional |
| Versión | 2.0 |
| Estado | Aprobado para implementación progresiva |
| Backend | Django REST Framework |
| Base relacional | PostgreSQL administrado mediante Supabase |
| Autenticación | Supabase Auth |
| Auditoría documental futura | MongoDB Atlas |
| Responsable principal | Martín Tapia |
| Fecha | 2026-11-09 |

---

## 2. Objetivo

Definir el modelo relacional regional para representar:

- países;
- tipos de documentos;
- roles;
- corredoras;
- perfiles internos;
- emisores;
- pertenencia organizacional;
- identificación tributaria.

El sistema debe permitir operar con entidades y usuarios asociados a los mercados de:

- Chile;
- Perú;
- Colombia.

Por esta razón, el modelo no puede utilizar el RUT chileno como identificador universal.

La identidad tributaria se representará mediante:

```text
tipo de documento + número de documento