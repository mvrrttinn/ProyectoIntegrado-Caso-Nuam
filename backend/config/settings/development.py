from .base import *

# Conversión robusta de booleano
DJANGO_DEBUG = os.getenv('DJANGO_DEBUG', 'True')
DEBUG = DJANGO_DEBUG.lower() in ('true', '1', 't')

# Obtener hosts permitidos con predeterminados locales
allowed_hosts_env = os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1')
ALLOWED_HOSTS = allowed_hosts_env.split(',')

# Configuración temporal de base de datos local
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# CORS configurado exclusivamente para Vite en desarrollo local
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]