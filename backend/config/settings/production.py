from .base import *

# Reglas estrictas de producción
DEBUG = False

# Fallo duro si faltan variables críticas
django_allowed_hosts = os.getenv('DJANGO_ALLOWED_HOSTS')
if not django_allowed_hosts:
    raise RuntimeError("Falta configurar DJANGO_ALLOWED_HOSTS para producción.")
ALLOWED_HOSTS = django_allowed_hosts.split(',')

database_url = os.getenv('DATABASE_URL')
if not database_url:
    raise RuntimeError("Falta configurar DATABASE_URL para producción.")

# IMPORTANTE: Este entorno de producción todavía no estará operativo hasta
# configurar PostgreSQL/Supabase y su controlador de conexión (ej. psycopg2/psycopg3).
# DATABASES = { ... }

# Seguridad adicional HTTP
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True