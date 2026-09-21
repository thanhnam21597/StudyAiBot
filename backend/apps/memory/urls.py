from django.urls import path
from apps.memory.views import MemoryDetailView

urlpatterns = [
    path('status/', MemoryDetailView.as_view(), name='memory-status'),
    path('sync/', MemoryDetailView.as_view(), name='memory-sync'),
]
