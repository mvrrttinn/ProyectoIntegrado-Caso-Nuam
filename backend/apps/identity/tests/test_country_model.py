import uuid

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase

from apps.identity.models import Country


class CountryModelTests(TestCase):
    def test_creates_country_with_uuid_primary_key(self):
        country = Country.objects.create(
            codigo_iso="CL",
            nombre="Chile",
        )

        self.assertIsInstance(
            country.id_pais,
            uuid.UUID,
        )

    def test_normalizes_iso_code_to_uppercase(self):
        country = Country.objects.create(
            codigo_iso=" cl ",
            nombre="Chile",
        )

        self.assertEqual(
            country.codigo_iso,
            "CL",
        )

    def test_trims_country_name(self):
        country = Country.objects.create(
            codigo_iso="PE",
            nombre="  Perú  ",
        )

        self.assertEqual(
            country.nombre,
            "Perú",
        )

    def test_country_is_active_by_default(self):
        country = Country.objects.create(
            codigo_iso="CO",
            nombre="Colombia",
        )

        self.assertTrue(country.activo)

    def test_rejects_iso_code_shorter_than_two_characters(self):
        country = Country(
            codigo_iso="C",
            nombre="Chile",
        )

        with self.assertRaises(ValidationError):
            country.save()

    def test_rejects_iso_code_longer_than_two_characters(self):
        country = Country(
            codigo_iso="CHL",
            nombre="Chile",
        )

        with self.assertRaises(ValidationError):
            country.save()

    def test_rejects_numeric_iso_code(self):
        country = Country(
            codigo_iso="12",
            nombre="País inválido",
        )

        with self.assertRaises(ValidationError):
            country.save()

    def test_rejects_empty_country_name(self):
        country = Country(
            codigo_iso="CL",
            nombre="   ",
        )

        with self.assertRaises(ValidationError):
            country.save()

    def test_rejects_duplicate_iso_code(self):
        Country.objects.create(
            codigo_iso="CL",
            nombre="Chile",
        )

        duplicate = Country(
            codigo_iso="cl",
            nombre="Otro Chile",
        )

        with self.assertRaises(ValidationError):
            duplicate.save()

    def test_rejects_duplicate_country_name(self):
        Country.objects.create(
            codigo_iso="CL",
            nombre="Chile",
        )

        duplicate = Country(
            codigo_iso="XX",
            nombre="Chile",
        )

        with self.assertRaises(ValidationError):
            duplicate.save()

    def test_database_rejects_duplicate_iso_code(self):
        Country.objects.create(
            codigo_iso="CL",
            nombre="Chile",
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Country.objects.bulk_create(
                    [
                        Country(
                            codigo_iso="CL",
                            nombre="Duplicado",
                        )
                    ]
                )

    def test_string_representation_contains_code_and_name(self):
        country = Country.objects.create(
            codigo_iso="PE",
            nombre="Perú",
        )

        self.assertEqual(
            str(country),
            "PE - Perú",
        )

    def test_model_uses_expected_database_table(self):
        self.assertEqual(
            Country._meta.db_table,
            "TB_PAISES",
        )

    def test_model_does_not_contain_sensitive_fields(self):
        field_names = {
            field.name
            for field in Country._meta.get_fields()
        }

        forbidden_fields = {
            "password",
            "password_hash",
            "token",
            "secret",
        }

        self.assertTrue(
            forbidden_fields.isdisjoint(field_names)
        )