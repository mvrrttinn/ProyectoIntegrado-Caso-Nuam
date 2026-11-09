import uuid

from django.core.exceptions import ValidationError
from django.db import models


class Country(models.Model):
    """
    País habilitado para operar dentro de la plataforma regional de nuam.

    Este catálogo comienza con Chile, Perú y Colombia, pero su estructura
    permite incorporar nuevos países mediante migraciones controladas.
    """

    id_pais = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    codigo_iso = models.CharField(
        max_length=2,
        unique=True,
    )

    nombre = models.CharField(
        max_length=100,
        unique=True,
    )

    activo = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        db_table = "TB_PAISES"
        verbose_name = "País"
        verbose_name_plural = "Países"
        ordering = ["nombre"]
        indexes = [
            models.Index(
                fields=["activo"],
                name="idx_tb_paises_activo",
            ),
        ]

    def clean(self):
        super().clean()

        if not isinstance(self.codigo_iso, str):
            raise ValidationError(
                {
                    "codigo_iso": (
                        "El código ISO debe ser una cadena de texto."
                    )
                }
            )

        if len(self.codigo_iso) != 2:
            raise ValidationError(
                {
                    "codigo_iso": (
                        "El código ISO debe contener exactamente "
                        "dos caracteres."
                    )
                }
            )

        if not self.codigo_iso.isalpha():
            raise ValidationError(
                {
                    "codigo_iso": (
                        "El código ISO debe contener solamente letras."
                    )
                }
            )

        if not isinstance(self.nombre, str):
            raise ValidationError(
                {
                    "nombre": (
                        "El nombre del país debe ser una cadena de texto."
                    )
                }
            )

        if not self.nombre:
            raise ValidationError(
                {
                    "nombre": (
                        "El nombre del país es obligatorio."
                    )
                }
            )

    def save(self, *args, **kwargs):
        """
        Normaliza los valores antes de ejecutar la validación completa.

        La normalización previa evita que Django evalúe max_length antes
        de retirar espacios accidentales del código ISO.
        """
        if isinstance(self.codigo_iso, str):
            self.codigo_iso = self.codigo_iso.strip().upper()

        if isinstance(self.nombre, str):
            self.nombre = self.nombre.strip()

        self.full_clean()

        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.codigo_iso} - {self.nombre}"