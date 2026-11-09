from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

class HealthCheckView(APIView):
    """
    Endpoint técnico de diagnóstico.
    Valida exclusivamente la disponibilidad del proceso web Django.
    No confirma DBs, autenticación ni casos de uso de negocio.
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def get(self, request, *args, **kwargs):
        payload = {
            "status": "ok",
            "service": "nuam-backend",
            "environment": settings.APP_ENV
        }
        return Response(payload)