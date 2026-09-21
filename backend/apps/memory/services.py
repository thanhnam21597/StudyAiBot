import json
import logging
import requests
from datetime import datetime
from django.conf import settings
from .utils import get_local_cache_path

logger = logging.getLogger(__name__)

class WalrusMemoryService:
    """
    Service giao tiếp trực tiếp với hệ thống lưu trữ phi tập trung Walrus Protocol (MemWal).
    - Read Memory: Truy xuất Blob bộ nhớ từ Walrus Aggregator.
    - Write Memory: Lưu trữ dữ liệu ký ức mới lên Walrus Publisher.
    """

    def __init__(self):
        self.publisher_url = settings.WALRUS_PUBLISHER_URL.rstrip('/')
        self.aggregator_url = settings.WALRUS_AGGREGATOR_URL.rstrip('/')
        self.default_epochs = getattr(settings, 'WALRUS_DEFAULT_EPOCHS', 5)

    def get_user_memory(self, user_id: str) -> dict:
        """
        Operating Rule 1: TRUY VẤN BỘ NHỚ
        Truy xuất ngữ cảnh học tập dài hạn của học viên từ Walrus/MemWal.
        """
        # 1. Kiểm tra cache/mapping blob_id cục bộ của user
        cache_path = get_local_cache_path(user_id)
        if cache_path.exists():
            try:
                with open(cache_path, 'r', encoding='utf-8') as f:
                    cached_info = json.load(f)
                    blob_id = cached_info.get('latest_blob_id')
                    if blob_id:
                        # Thử lấy từ Aggregator của Walrus
                        blob_data = self.fetch_blob(blob_id)
                        if blob_data:
                            return blob_data
                    # Fallback dữ liệu nội dung trong cache
                    return cached_info.get('memory_data', {})
            except Exception as e:
                logger.error(f"Error reading local memory cache for {user_id}: {e}")

        # Default memory record for new student
        return {
            "user_id": user_id,
            "status": "new_student",
            "current_goal": "Get familiar with the study roadmap and Walrus Memory system",
            "known_topics": [],
            "weak_points": [],
            "in_progress_tasks": [],
            "last_updated": datetime.utcnow().isoformat()
        }

    def save_user_memory(self, user_id: str, memory_payload: dict) -> dict:
        """
        Operating Rule 2: CẬP NHẬT BỘ NHỚ
        Đẩy dữ liệu ký ức mới lên mạng phi tập trung Walrus Protocol.
        """
        memory_payload["last_updated"] = datetime.utcnow().isoformat()
        payload_bytes = json.dumps(memory_payload, ensure_ascii=False, indent=2).encode('utf-8')

        blob_id = None
        walrus_response = None

        # Gửi PUT request tới Walrus Publisher API
        try:
            url = f"{self.publisher_url}/v1/blobs?epochs={self.default_epochs}"
            res = requests.put(
                url,
                data=payload_bytes,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            if res.status_code in [200, 201]:
                data = res.json()
                # Walrus format: data['newlyCreated']['blobObject']['blobId'] hoặc data['alreadyCertified']['blobId']
                if 'newlyCreated' in data:
                    blob_id = data['newlyCreated'].get('blobObject', {}).get('blobId')
                elif 'alreadyCertified' in data:
                    blob_id = data['alreadyCertified'].get('blobId')
                walrus_response = data
                logger.info(f"Successfully published memory to Walrus! Blob ID: {blob_id}")
            else:
                logger.warning(f"Walrus Publisher returned HTTP {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Walrus Publisher connection failed (fallback to local): {e}")

        # Đồng bộ cache cục bộ
        cache_path = get_local_cache_path(user_id)
        cache_data = {
            "user_id": user_id,
            "latest_blob_id": blob_id or f"mock-walrus-blob-{int(datetime.utcnow().timestamp())}",
            "memory_data": memory_payload,
            "synced_at": datetime.utcnow().isoformat(),
            "walrus_raw": walrus_response
        }
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, ensure_ascii=False, indent=2)

        return cache_data

    def fetch_blob(self, blob_id: str) -> dict:
        """
        Tải nội dung Blob từ Walrus Aggregator theo blob_id.
        """
        try:
            url = f"{self.aggregator_url}/v1/blobs/{blob_id}"
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                return res.json()
        except Exception as e:
            logger.error(f"Failed to fetch blob {blob_id} from Walrus Aggregator: {e}")
        return None
