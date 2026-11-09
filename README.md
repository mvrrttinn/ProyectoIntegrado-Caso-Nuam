# Mantenedor Web Centralizado de Calificaciones Tributarias y Dividendos

Plataforma web centralizada desarrollada para **nuam** (Holding Bursátil Regional), diseñada para la automatización algorítmica, validación preventiva de las Declaraciones Juradas 1949 y 1922, y persistencia inmutable bajo estándares ISO/IEC 27001 y normativas de la CMF.

## 🏗 Arquitectura
El proyecto sigue el modelo de 4+1 Vistas de Kruchten y utiliza un stack de persistencia híbrida:
- **Frontend:** React, Vite, TypeScript.
- **Backend:** Python 3.12, Django REST Framework.
- **Base de Datos Transaccional (ACID):** PostgreSQL gestionado vía Supabase.
- **Base de Datos Documental (Auditoría):** MongoDB Atlas (cadena de integridad criptográfica de eventos).
- **Infraestructura y Seguridad:** Docker, Supabase Auth (RBAC), GitHub Actions.

## 📁 Estructura del Repositorio
- `/backend`: API RESTful, motor de cálculo tributario y lógica de persistencia.
- `/frontend`: Single Page Application (SPA) y componentes UI/UX.
- `/docs`: Documentación técnica, diagramas de arquitectura 4+1 y planes de prueba.
- `/infrastructure`: Archivos de despliegue, Dockerfiles y configuraciones DevSecOps.

## ⚙️ Requisitos Previos (Entorno de Desarrollo)
*(Las instrucciones de instalación y configuración de dependencias se detallarán en las siguientes fases del proyecto).*

## 🛡 Seguridad y Buenas Prácticas
Este proyecto adhiere a prácticas DevSecOps:
- Prohibición estricta de almacenar credenciales o secretos en el control de versiones.
- Uso del patrón Transactional Outbox para consistencia híbrida.
- Auditoría append-only sin permisos de actualización/eliminación desde la aplicación.

## 👥 Equipo de Trabajo
- **Líder & Arquitecto:** Angelo Zamora
- **Backend & Data Engineer:** Martín Tapia
- **Frontend, UI/UX & QA:** Vicente Sagredo