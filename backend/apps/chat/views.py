from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.chat.services import ChatService
from apps.chat.models import StudySession, ChatMessage

class ChatMessageView(APIView):
    """
    Endpoint: POST /api/chat/message/
    Body:
    {
        "user_id": "student_123",
        "message": "Em đang làm bài tập Dijkstra bị dở..."
    }
    """
    def post(self, request):
        user_id = request.data.get('user_id', 'default_student')
        message = request.data.get('message', '').strip()

        if not message:
            return Response({"error": "Message content cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve or create active session
        session, _ = StudySession.objects.get_or_create(user_id=user_id, defaults={'title': f'Session - {user_id}'})
        
        # Save user message
        user_msg = ChatMessage.objects.create(session=session, role='user', content=message)

        # Get recent active history (excluding recalled messages)
        history = list(
            session.messages.filter(is_recalled=False)
            .order_by('-timestamp')[:8]
            .values('role', 'content')
        )
        history.reverse()

        # Call service with memory context
        result = ChatService.generate_response(user_id=user_id, message=message, chat_history=history)

        # Save assistant message
        bot_msg = ChatMessage.objects.create(session=session, role='assistant', content=result['reply'])

        # Attach message objects to response for frontend tracking
        result['user_message'] = {
            'id': user_msg.id,
            'role': user_msg.role,
            'content': user_msg.content,
            'timestamp': user_msg.timestamp.isoformat(),
            'is_recalled': user_msg.is_recalled,
        }
        result['assistant_message'] = {
            'id': bot_msg.id,
            'role': bot_msg.role,
            'content': bot_msg.content,
            'timestamp': bot_msg.timestamp.isoformat(),
            'is_recalled': bot_msg.is_recalled,
        }

        return Response(result, status=status.HTTP_200_OK)


class RecallMessageView(APIView):
    """
    Endpoint: POST /api/chat/message/<int:message_id>/recall/
    Body:
    {
        "user_id": "student_123"
    }
    """
    def post(self, request, message_id):
        user_id = request.data.get('user_id') or request.query_params.get('user_id')
        try:
            message = ChatMessage.objects.select_related('session').get(id=message_id)
        except ChatMessage.DoesNotExist:
            return Response({"error": "Message not found."}, status=status.HTTP_404_NOT_FOUND)

        if user_id and message.session.user_id != user_id:
            return Response(
                {"error": "You do not have permission to recall this message."},
                status=status.HTTP_403_FORBIDDEN
            )

        if not message.is_recalled:
            message.is_recalled = True
            message.recalled_at = timezone.now()
            message.save(update_fields=['is_recalled', 'recalled_at'])

        return Response({
            "success": True,
            "message_id": message.id,
            "is_recalled": True,
            "recalled_at": message.recalled_at.isoformat() if message.recalled_at else None,
            "message": "Tin nhắn đã được thu hồi thành công."
        }, status=status.HTTP_200_OK)

    def delete(self, request, message_id):
        user_id = request.data.get('user_id') or request.query_params.get('user_id')
        try:
            message = ChatMessage.objects.select_related('session').get(id=message_id)
        except ChatMessage.DoesNotExist:
            return Response({"error": "Message not found."}, status=status.HTTP_404_NOT_FOUND)

        if user_id and message.session.user_id != user_id:
            return Response(
                {"error": "You do not have permission to delete this message."},
                status=status.HTTP_403_FORBIDDEN
            )

        message.delete()
        return Response({
            "success": True,
            "message_id": message_id,
            "message": "Tin nhắn đã được xóa thành công."
        }, status=status.HTTP_200_OK)


class SessionHistoryView(APIView):
    """
    Endpoint: GET /api/chat/history/?user_id=student_123
              DELETE /api/chat/history/?user_id=student_123
    """
    def get(self, request):
        user_id = request.query_params.get('user_id', 'default_student')
        try:
            session = StudySession.objects.get(user_id=user_id)
            messages_qs = session.messages.order_by('timestamp').values(
                'id', 'role', 'content', 'timestamp', 'is_recalled', 'recalled_at'
            )
            formatted_messages = []
            for m in messages_qs:
                is_recalled = bool(m.get('is_recalled'))
                formatted_messages.append({
                    "id": m["id"],
                    "role": m["role"],
                    "content": "Tin nhắn đã được thu hồi" if is_recalled else m["content"],
                    "timestamp": m["timestamp"].isoformat() if hasattr(m["timestamp"], 'isoformat') else m["timestamp"],
                    "is_recalled": is_recalled,
                    "recalled_at": m["recalled_at"].isoformat() if m.get("recalled_at") and hasattr(m["recalled_at"], 'isoformat') else m.get("recalled_at"),
                })
            return Response({"user_id": user_id, "messages": formatted_messages}, status=status.HTTP_200_OK)
        except StudySession.DoesNotExist:
            return Response({"user_id": user_id, "messages": []}, status=status.HTTP_200_OK)

    def delete(self, request):
        user_id = request.query_params.get('user_id') or request.data.get('user_id', 'default_student')
        try:
            session = StudySession.objects.get(user_id=user_id)
            session.messages.all().delete()
            return Response({"message": "Chat history cleared successfully."}, status=status.HTTP_200_OK)
        except StudySession.DoesNotExist:
            return Response({"message": "No session found."}, status=status.HTTP_200_OK)
