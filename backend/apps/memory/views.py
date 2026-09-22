from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.memory.services import WalrusMemoryService


class MemoryDetailView(APIView):
    """
    GET /api/memory/status/ — Recall student memories + health check.
    POST /api/memory/sync/ — Store new facts into MemWal.
    """

    def get(self, request):
        user_id = request.query_params.get('user_id', 'default_student')
        service = WalrusMemoryService()

        try:
            memory_data = service.get_user_memory(user_id)
            return Response(memory_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "user_id": user_id,
                "namespace": f"studymate:{user_id}",
                "health": False,
                "memory_count": 0,
                "memories": [],
                "status": "error",
                "error": str(e),
            }, status=status.HTTP_200_OK)

    def post(self, request):
        user_id = request.data.get('user_id', 'default_student')
        facts = request.data.get('facts', [])
        payload = request.data.get('memory_payload', {})

        if not facts and not payload:
            return Response(
                {"error": "Provide 'facts' (list of strings) or 'memory_payload'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        service = WalrusMemoryService()

        if facts:
            # Direct fact storage via MemWal
            result = service.remember_facts(user_id, facts)
        else:
            # Legacy payload-based storage
            result = service.save_user_memory(user_id, payload)

        return Response({
            "message": "MemWal memory synchronized!",
            "data": result,
        }, status=status.HTTP_200_OK)
