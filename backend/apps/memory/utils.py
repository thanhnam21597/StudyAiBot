import os
from pathlib import Path
from django.conf import settings

def get_memory_storage_dir() -> Path:
    """Trả về thư mục lưu cache bộ nhớ tạm của hệ thống."""
    storage_dir = settings.BASE_DIR / 'storage' / 'memwal_cache'
    storage_dir.mkdir(parents=True, exist_ok=True)
    return storage_dir

def get_local_cache_path(user_id: str) -> Path:
    """Trả về đường dẫn file cache JSON cho user_id tương ứng."""
    safe_user_id = "".join([c for c in user_id if c.isalnum() or c in ('-', '_')]).strip()
    if not safe_user_id:
        safe_user_id = "default_user"
    return get_memory_storage_dir() / f"{safe_user_id}_memory.json"
