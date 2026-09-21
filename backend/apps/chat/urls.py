from django.urls import path
from apps.chat.views import ChatMessageView, SessionHistoryView, RecallMessageView

urlpatterns = [
    path('message/', ChatMessageView.as_view(), name='chat-message'),
    path('message/<int:message_id>/recall/', RecallMessageView.as_view(), name='chat-message-recall'),
    path('message/<int:message_id>/', RecallMessageView.as_view(), name='chat-message-detail'),
    path('history/', SessionHistoryView.as_view(), name='chat-history'),
]
