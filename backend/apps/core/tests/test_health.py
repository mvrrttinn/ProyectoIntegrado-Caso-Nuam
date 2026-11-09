from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.conf import settings

class HealthCheckAPITests(APITestCase):
    
    def setUp(self):
        # Utiliza el namespace definido en urls.py para obtener la ruta
        self.url = reverse('core:health-check')

    def test_health_check_get_success(self):
        """
        1, 2, 3, 4, 5, 6, 12: GET devuelve 200, Content-Type JSON,
        claves/valores exactos y cero consultas a la base de datos.
        """
        # Garantiza que el endpoint no toca la base de datos
        with self.assertNumQueries(0):
            response = self.client.get(self.url)
        
        # Validar código HTTP 200 y Content-Type
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/json')
        
        data = response.json()
        
        # Validar claves exactas
        expected_keys = {'status', 'service', 'environment'}
        self.assertEqual(set(data.keys()), expected_keys)
        
        # Validar valores exactos
        self.assertEqual(data['status'], 'ok')
        self.assertEqual(data['service'], 'nuam-backend')
        self.assertEqual(data['environment'], settings.APP_ENV)

    def test_health_check_methods_not_allowed(self):
        """
        7, 8, 9, 10: POST, PUT, PATCH y DELETE devuelven 405.
        """
        methods = [
            self.client.post,
            self.client.put,
            self.client.patch,
            self.client.delete
        ]
        
        for method in methods:
            with self.subTest(method=method.__name__):
                response = method(self.url)
                self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_health_check_no_sensitive_data(self):
        """
        11: La respuesta no expone secretos, contraseñas ni configuraciones.
        """
        response = self.client.get(self.url)
        data_str = str(response.json()).lower()
        
        sensitive_keys = ['secret', 'password', 'token', 'database_url', 'mongodb_uri', 'key']
        
        for key in sensitive_keys:
            with self.subTest(key=key):
                self.assertNotIn(key, data_str)