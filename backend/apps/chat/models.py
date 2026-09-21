from django.db import models

class StudySession(models.Model):
    user_id = models.CharField(max_length=128, db_index=True)
    title = models.CharField(max_length=255, default="New Study Session")
    walrus_blob_id = models.CharField(max_length=255, blank=True, null=True, help_text="Latest Walrus Memory Blob ID")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.user_id})"

class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]

    session = models.ForeignKey(StudySession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    is_synced_to_walrus = models.BooleanField(default=False)
    is_recalled = models.BooleanField(default=False, help_text="Mark whether the message has been recalled")
    recalled_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when message was recalled")
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        status = " [RECALLED]" if self.is_recalled else ""
        return f"[{self.role}]{status} {self.content[:40]}..."
