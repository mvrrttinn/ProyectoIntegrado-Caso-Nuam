from django.core.exceptions import ValidationError
from django.test import SimpleTestCase

from apps.identity.validators import (
    calculate_chilean_rut_verification_digit,
    normalize_chilean_rut,
    validate_chilean_rut,
)


class ChileanRutNormalizationTests(SimpleTestCase):
    def test_normalizes_points_spaces_and_lowercase_k(self):
        self.assertEqual(
            normalize_chilean_rut(" 12.345.678-k "),
            "12345678-K",
        )

    def test_rejects_none(self):
        with self.assertRaises(ValidationError):
            normalize_chilean_rut(None)

    def test_rejects_empty_value(self):
        with self.assertRaises(ValidationError):
            normalize_chilean_rut("   ")


class ChileanRutVerificationDigitTests(SimpleTestCase):
    def test_calculates_numeric_verification_digit(self):
        self.assertEqual(
            calculate_chilean_rut_verification_digit("12345678"),
            "5",
        )

    def test_calculates_k_verification_digit(self):
        self.assertEqual(
            calculate_chilean_rut_verification_digit("10000013"),
            "K",
        )

    def test_rejects_non_numeric_body(self):
        with self.assertRaises(ValidationError):
            calculate_chilean_rut_verification_digit("123A5678")


class ChileanRutValidationTests(SimpleTestCase):
    def test_accepts_valid_rut_without_points(self):
        validate_chilean_rut("12345678-5")

    def test_accepts_valid_rut_with_points(self):
        validate_chilean_rut("12.345.678-5")

    def test_accepts_valid_rut_with_lowercase_k(self):
        validate_chilean_rut("10.000.013-k")

    def test_rejects_invalid_verification_digit(self):
        with self.assertRaises(ValidationError):
            validate_chilean_rut("12345678-9")

    def test_rejects_missing_hyphen(self):
        with self.assertRaises(ValidationError):
            validate_chilean_rut("123456785")

    def test_rejects_letters_in_body(self):
        with self.assertRaises(ValidationError):
            validate_chilean_rut("12A45678-5")