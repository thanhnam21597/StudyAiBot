import os
import json
import logging
import requests
from django.conf import settings
from apps.memory.services import WalrusMemoryService

logger = logging.getLogger(__name__)

STUDY_MATE_SYSTEM_PROMPT = """You are "StudyMate Bot" — an intelligent personalized study companion with long-term memory powered by Walrus Memory (MemWal), a decentralized persistent memory layer.

Core Objectives:
- Assist students in understanding concepts (programming, computer science, mathematics, languages, etc.).
- Seamlessly use the student's recalled long-term memories to continue mentoring without asking them to repeat context.

Operating Rules:
1. READ MEMORY: Use the recalled memories below to provide personalized, context-aware help.
2. COMMUNICATION STYLE: Friendly, concise, supportive, and encouraging. Prioritize realistic practical examples, clean code snippets, and step-by-step guidance.
3. LANGUAGE: Respond in the same language the student uses. Keep memory records in English.
"""

FACT_EXTRACTION_PROMPT = """You are a fact-extraction assistant. Analyze this conversation between a student and their study bot.
Extract key new learning facts as short, atomic English sentences. Each fact should be ONE piece of information.

Rules:
- Only extract NEW information that would be useful to remember for future sessions.
- Each fact must be a single, standalone sentence.
- Focus on: what the student is learning, their goals, their strengths, weaknesses, preferences, and progress.
- Do NOT extract greetings, small talk, or bot responses that don't contain student info.
- Return ONLY a valid JSON array of strings. No markdown, no explanation.
- If no new facts are found, return an empty array: []

Examples of good facts:
["Student is learning graph algorithms", "Student struggles with Dijkstra's algorithm", "Student prefers Python over Java", "Student's goal is to pass the DSA exam next month"]

Conversation:
Student: {user_message}
Bot: {bot_reply}

Extracted facts (JSON array only):"""


class ChatService:
    @staticmethod
    def generate_response(user_id: str, message: str, chat_history: list = None) -> dict:
        """
        Full MemWal-powered chat flow:
        1. recall(query=user_message) — fetch relevant memories
        2. LLM with recalled facts as context
        3. Extract new facts from conversation
        4. remember(facts) — store each fact
        """
        if chat_history is None:
            chat_history = []

        memory_service = WalrusMemoryService()
        recalled_facts = []
        memory_error = None

        # ── Step 1: Recall relevant memories ──
        try:
            recalled = memory_service.recall_memories(user_id, query=message)
            recalled_facts = [m["text"] for m in recalled if m.get("text")]
            logger.info(f"Recalled {len(recalled_facts)} memories for user '{user_id}'")
        except Exception as e:
            memory_error = f"MemWal recall failed: {e}"
            logger.error(memory_error)

        # ── Step 2: Build LLM prompt with recalled facts ──
        if recalled_facts:
            facts_block = "\n".join(f"- {f}" for f in recalled_facts)
            context_str = f"\n--- RECALLED MEMORIES FOR STUDENT ({user_id}) ---\n{facts_block}\n---"
        else:
            context_str = f"\n--- No memories stored yet for student ({user_id}). This may be their first session. ---"

        messages_payload = [
            {"role": "system", "content": f"{STUDY_MATE_SYSTEM_PROMPT}{context_str}"}
        ]

        for item in chat_history[-6:]:
            messages_payload.append({
                "role": item.get('role', 'user'),
                "content": item.get('content', '')
            })

        messages_payload.append({"role": "user", "content": message})

        # ── Step 3: Call LLM for main reply ──
        reply_text = ""
        api_base = os.getenv('LLM_API_BASE', getattr(settings, 'LLM_API_BASE', 'https://api.groq.com/openai/v1')).rstrip('/')
        api_key = os.getenv('LLM_API_KEY', getattr(settings, 'LLM_API_KEY', ''))
        configured_model = os.getenv('LLM_MODEL_NAME', getattr(settings, 'LLM_MODEL_NAME', 'openai/gpt-oss-120b'))

        candidate_models = list(dict.fromkeys([configured_model, 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']))

        for model_name in candidate_models:
            try:
                response = requests.post(
                    f"{api_base}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model_name,
                        "messages": messages_payload,
                        "temperature": 0.7,
                    },
                    timeout=30
                )
                if response.status_code == 200:
                    data = response.json()
                    reply_text = data['choices'][0]['message']['content']
                    break
                elif response.status_code == 404:
                    logger.warning(f"Model {model_name} not found, trying fallback...")
                    continue
                else:
                    logger.error(f"LLM API Error with {model_name}: {response.status_code} - {response.text}")
                    reply_text = f"AI Provider Response Error ({response.status_code}): {response.text[:150]}"
                    break
            except Exception as e:
                logger.error(f"LLM exception with {model_name}: {e}")
                reply_text = f"Hello! StudyMate Bot encountered a connection issue: {e}"
                break

        # ── Step 4: Extract new facts from conversation ──
        new_facts = []
        try:
            new_facts = ChatService._extract_facts(api_base, api_key, configured_model, message, reply_text)
            logger.info(f"Extracted {len(new_facts)} new facts from conversation")
        except Exception as e:
            logger.warning(f"Fact extraction failed (non-critical): {e}")

        # ── Step 5: Remember each extracted fact ──
        remember_result = {"stored": [], "errors": []}
        if new_facts:
            try:
                remember_result = memory_service.remember_facts(user_id, new_facts)
                logger.info(f"Stored {len(remember_result['stored'])} new memories for '{user_id}'")
            except Exception as e:
                logger.error(f"remember_facts failed: {e}")
                remember_result["errors"].append({"fact": "ALL", "error": str(e)})

        return {
            "reply": reply_text,
            "recalled_facts": recalled_facts,
            "new_facts_stored": remember_result["stored"],
            "memory_errors": remember_result.get("errors", []),
            "memory_error": memory_error,
            "user_id": user_id,
        }

    @staticmethod
    def _extract_facts(api_base: str, api_key: str, model: str,
                       user_message: str, bot_reply: str) -> list:
        """
        Use a targeted LLM call to extract atomic facts from the conversation.
        Returns a list of fact strings.
        """
        prompt = FACT_EXTRACTION_PROMPT.format(
            user_message=user_message,
            bot_reply=bot_reply[:500]  # Limit bot reply to avoid token waste
        )

        try:
            response = requests.post(
                f"{api_base}/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,  # Low temperature for structured output
                },
                timeout=15
            )
            if response.status_code == 200:
                content = response.json()['choices'][0]['message']['content'].strip()
                # Parse JSON array from response (handle potential markdown wrapping)
                if content.startswith("```"):
                    content = content.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                facts = json.loads(content)
                if isinstance(facts, list):
                    return [f for f in facts if isinstance(f, str) and f.strip()]
        except json.JSONDecodeError as e:
            logger.warning(f"Fact extraction returned invalid JSON: {e}")
        except Exception as e:
            logger.warning(f"Fact extraction LLM call failed: {e}")

        return []
