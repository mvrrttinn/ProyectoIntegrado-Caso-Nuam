import re

from django.core.exceptions import ValidationError


CHILEAN_RUT_PATTERN = re.compile(r"^\d{1,8}-[\dK]$")


def normalize_chilean_rut(value: str) -> str:
    """
    Normaliza un RUT chileno eliminando puntos y espacios,
    convirtiendo la letra K a mayúscula y conservando el guion.

    Ejemplo:
        12.345.678-k -> 12345678-K
    """
    if not isinstance(value, str):
        raise ValidationError(
            "El RUT chileno debe ser una cadena de texto."
        )

    normalized = (
        value
        .strip()
        .replace(".", "")
        .replace(" ", "")
        .upper()
    )

    if not normalized:
        raise ValidationError(
            "El RUT chileno es obligatorio."
        )

    return normalized


def calculate_chilean_rut_verification_digit(body: str) -> str:
    """
    Calcula el dígito verificador de un RUT chileno mediante módulo 11.
    """
    if not isinstance(body, str) or not body.isdigit():
        raise ValidationError(
            "El cuerpo del RUT chileno debe contener solo números."
        )

    multiplier = 2
    total = 0

    for digit in reversed(body):
        total += int(digit) * multiplier
        multiplier = 2 if multiplier == 7 else multiplier + 1

    result = 11 - (total % 11)

    if result == 11:
        return "0"

    if result == 10:
        return "K"

    return str(result)


def validate_chilean_rut(value: str) -> None:
    """
    Valida formato y dígito verificador de un RUT chileno.

    Esta función se aplica exclusivamente a la combinación:

        country_code = CL
        document_type = RUT

    No debe utilizarse para validar RUC peruano ni NIT colombiano.
    """
    normalized = normalize_chilean_rut(value)

    if not CHILEAN_RUT_PATTERN.fullmatch(normalized):
        raise ValidationError(
            "El RUT chileno debe tener un formato válido, "
            "por ejemplo 12345678-5."
        )

    body, provided_digit = normalized.split("-")
    expected_digit = calculate_chilean_rut_verification_digit(body)

    if provided_digit != expected_digit:
        raise ValidationError(
            "El dígito verificador del RUT chileno no es válido."
        )