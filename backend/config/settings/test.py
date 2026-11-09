import os


# Clave exclusiva para pruebas automatizadas.
# No corresponde a una credencial de desarrollo o producción.
os.environ.setdefault(
    "DJANGO_SECRET_KEY",
    "test-only-secret-key-not-for-production",
)

from .base import *  # noqa: E402, F401, F403


DEBUG = False
APP_ENV = "test"


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}