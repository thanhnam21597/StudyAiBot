import os
import json
import logging
from datetime import datetime
from memwal import MemWalSync, RecallParams
from .utils import get_local_cache_path

logger = logging.getLogger(__name__)


class WalrusMemoryService:
    """
    Service powered by the official MemWal Python SDK.
    Each student gets an isolated namespace: f"studymate:{user_id}".
    One memory = one atomic fact sentence (not one giant JSON blob).
    """

    def _get_client(self, user_id: str) -> MemWalSync:
        """Create a MemWalSync client scoped to the student's namespace."""
        key = os.getenv("MEMWAL_PRIVATE_KEY", "")
        account_id = os.getenv("MEMWAL_ACCOUNT_ID", "")
        env = os.getenv("MEMWAL_ENV", "prod")

        if not key or not account_id:
            raise RuntimeError(
                "MEMWAL_PRIVATE_KEY and MEMWAL_ACCOUNT_ID must be set in .env. "
                "Visit https://memory.walrus.xyz to generate delegate keys."
            )

        return MemWalSync.create(
            key=key,
            account_id=account_id,
            env=env,
            namespace=f"studymate:{user_id}",
        )

    def health_check(self, user_id: str = "default") -> bool:
        """Ping MemWal to verify connectivity."""
        try:
            client = self._get_client(user_id)
            client.health()
            return True
        except Exception as e:
            logger.error(f"MemWal health check failed: {e}")
            return False

    def recall_memories(self, user_id: str, query: str) -> list:
        """
        Semantic search via MemWal recall().
        Returns a list of fact-string dicts: [{"text": "...", "distance": 0.xx}, ...]
        """
        try:
            client = self._get_client(user_id)
            result = client.recall(RecallParams(query=query))
            memories = []
            for m in result.results:
                memories.append({
                    "text": m.text,
                    "distance": round(m.distance, 4) if hasattr(m, 'distance') else None,
                })
            logger.info(f"MemWal recall for '{user_id}' query='{query[:60]}' → {len(memories)} results")

            # Debug cache: save latest recall to local JSON
            self._save_debug_cache(user_id, memories)

            return memories
        except Exception as e:
            logger.error(f"MemWal recall failed for user '{user_id}': {e}")
            # Surface the error — do NOT silently pretend memory worked
            raise

    def remember_facts(self, user_id: str, facts: list) -> dict:
        """
        Store atomic facts via MemWal remember_and_wait().
        Each fact is a single plain English sentence.
        Returns {"stored": [...], "errors": [...]}.
        """
        if not facts:
            return {"stored": [], "errors": []}

        try:
            client = self._get_client(user_id)
        except Exception as e:
            return {"stored": [], "errors": [{"fact": "ALL", "error": str(e)}]}

        stored = []
        errors = []
        for fact in facts:
            fact = fact.strip()
            if not fact:
                continue
            try:
                client.remember_and_wait(fact)
                stored.append(fact)
                logger.info(f"MemWal remembered for '{user_id}': {fact[:80]}")
            except Exception as e:
                logger.error(f"MemWal remember failed for '{user_id}': {fact[:60]} → {e}")
                errors.append({"fact": fact, "error": str(e)})

        return {"stored": stored, "errors": errors}

    def get_user_memory(self, user_id: str) -> dict:
        """
        High-level method: recall a broad summary of student memories.
        Used by the memory status panel and chat context.
        Returns a dict with recalled facts and metadata.
        """
        try:
            memories = self.recall_memories(user_id, "student learning progress goals topics weak points")
            health = self.health_check(user_id)
            return {
                "user_id": user_id,
                "namespace": f"studymate:{user_id}",
                "health": health,
                "memory_count": len(memories),
                "memories": memories,
                "status": "connected" if health else "error",
            }
        except Exception as e:
            logger.error(f"get_user_memory failed for '{user_id}': {e}")
            return {
                "user_id": user_id,
                "namespace": f"studymate:{user_id}",
                "health": False,
                "memory_count": 0,
                "memories": [],
                "status": "error",
                "error": str(e),
            }

    def save_user_memory(self, user_id: str, memory_payload: dict) -> dict:
        """
        Legacy-compatible method: accepts a payload and stores it as facts.
        If payload contains a 'facts' list, store each one.
        Otherwise treat the whole payload as a single fact string.
        """
        facts = memory_payload.get('facts', [])
        if not facts and isinstance(memory_payload, dict):
            # Try to extract meaningful strings from the payload
            for key in ['current_goal', 'known_topics', 'weak_points', 'in_progress_tasks']:
                value = memory_payload.get(key)
                if isinstance(value, str) and value:
                    facts.append(f"Student {key.replace('_', ' ')}: {value}")
                elif isinstance(value, list):
                    for item in value:
                        if isinstance(item, str) and item:
                            facts.append(f"Student {key.replace('_', ' ')}: {item}")

        result = self.remember_facts(user_id, facts)
        return {
            "user_id": user_id,
            "namespace": f"studymate:{user_id}",
            "remember_result": result,
        }

    def _save_debug_cache(self, user_id: str, memories: list):
        """Save latest recall result to local JSON for debugging only."""
        try:
            cache_path = get_local_cache_path(user_id)
            cache_data = {
                "user_id": user_id,
                "namespace": f"studymate:{user_id}",
                "cached_at": datetime.utcnow().isoformat(),
                "debug_note": "This is a local debug cache only. Source of truth is MemWal.",
                "memories": memories,
            }
            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning(f"Failed to write debug cache for '{user_id}': {e}")
