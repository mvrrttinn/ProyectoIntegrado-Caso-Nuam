# Mantenedor Web Centralizado de Calificaciones Tributarias y Dividendos

## 📖 Descripción y Problema
Plataforma desarrollada para **nuam** (Holding Bursátil Regional). Las corredoras procesan información tributaria mediante procedimientos manuales y archivos dispersos, lo que genera riesgos críticos de descuadres aritméticos e incumplimiento en las declaraciones juradas del SII (DJ 1949 / DJ 1922) y normativas de la CMF.

## 💡 Solución y Arquitectura
Este mantenedor automatiza la ingesta, validación y cálculo de factores tributarios, asegurando que la suma de proporciones (`factor_afecto + factor_exento`) sea exactamente `1.000000` (con precisión de 6 decimales, sin uso de floats).

El proyecto se rige bajo el **Modelo 4+1 Vistas de Kruchten** y una **persistencia híbrida** (planificada, pendiente de configuración):
- **Frontend:** React, TypeScript, Vite.
- **Backend:** Python 3.12, Django REST Framework.
- **Base de Datos ACID (Estructurada):** PostgreSQL vía Supabase (por implementar).
- **Auditoría (Documental):** MongoDB Atlas para la cadena de integridad criptográfica de eventos (por implementar).

## 📂 Estructura del Proyecto
- `/backend`: API, motor de cálculo y orquestador transaccional.
- `/frontend`: Single Page Application (SPA).
- `/docs`: Diagramas UML y BPMN (próximamente).

## 🚀 Requisitos e Instalación

### 1. Backend (Django)
```powershell
# Activar en cmd (Command Prompt):
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver