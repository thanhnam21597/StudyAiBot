from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.memory.services import WalrusMemoryService

class MemoryDetailView(APIView):
    """
    GET: Lấy thông tin Walrus Memory hiện tại của User
    POST: Cập nhật hoặc lưu snapshot ký ức mới lên Walrus
    """
    def get(self, request):
        user_id = request.query_params.get('user_id', 'default_student')
        service = WalrusMemoryService()
        memory = service.get_user_memory(user_id)
        return Response(memory, status=status.HTTP_200_OK)

    def post(self, request):
        user_id = request.data.get('user_id', 'default_student')
        payload = request.data.get('memory_payload', {})
        if not payload:
            return Response({"error": "memory_payload cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        service = WalrusMemoryService()
        result = service.save_user_memory(user_id, payload)
        return Response({
            "message": "Walrus Memory synchronized successfully!",
            "data": result
        }, status=status.HTTP_200_OK)
