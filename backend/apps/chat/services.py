import os
import json
import logging
import requests
from django.conf import settings
from apps.memory.services import WalrusMemoryService

logger = logging.getLogger(__name__)

STUDY_MATE_SYSTEM_PROMPT = """You are "StudyMate Bot" - an intelligent personalized study companion with long-term memory powered by the Walrus Protocol decentralized storage system (MemWal).

Core Objectives:
- Assist students in understanding concepts (programming, computer science, mathematics, languages, etc.).
- Seamlessly retrieve and incorporate the student's long-term learning progress, weak points, and ongoing projects from Walrus Memory.

Operating Rules:
1. READ MEMORY: Utilize context from the student's Walrus Memory provided below to continue mentoring smoothly without asking them to repeat previous context.
2. COMMUNICATION STYLE: Friendly, concise, supportive, and encouraging. When suggesting solutions, prioritize realistic practical examples, clean code snippets, and step-by-step guidance.
3. LANGUAGE: Communicate naturally in English (or respond in whatever language the student prompts in, while keeping memory records in English).
"""

class ChatService:
    @staticmethod
    def generate_response(user_id: str, message: str, chat_history: list = None) -> dict:
        """
        Generate response from LLM with decentralized Walrus Memory context injected.
        """
        if chat_history is None:
            chat_history = []

        # 1. Read Walrus Memory context
        walrus_service = WalrusMemoryService()
        memory_data = walrus_service.get_user_memory(user_id)
        
        # Build prompt with memory context
        context_str = f"--- CURRENT WALRUS MEMORY CONTEXT FOR STUDENT ({user_id}) ---\n"
        if memory_data:
            context_str += json.dumps(memory_data, ensure_ascii=False, indent=2)
        else:
            context_str += "No memory records currently stored on Walrus."

        messages_payload = [
            {"role": "system", "content": f"{STUDY_MATE_SYSTEM_PROMPT}\n\n{context_str}"}
        ]
        
        for item in chat_history[-6:]:
            messages_payload.append({"role": item.get('role', 'user'), "content": item.get('content', '')})
        
        messages_payload.append({"role": "user", "content": message})

        # 2. Call LLM API (Groq / Ollama / vLLM / OpenAI compatible)
        reply_text = ""
        api_base = os.getenv('LLM_API_BASE', getattr(settings, 'LLM_API_BASE', 'https://api.groq.com/openai/v1')).rstrip('/')
        api_key = os.getenv('LLM_API_KEY', getattr(settings, 'LLM_API_KEY', ''))
        configured_model = os.getenv('LLM_MODEL_NAME', getattr(settings, 'LLM_MODEL_NAME', 'openai/gpt-oss-120b'))

        candidate_models = [configured_model, 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']
        # remove duplicates while preserving order
        candidate_models = list(dict.fromkeys(candidate_models))

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
                    logger.warning(f"Model {model_name} not found on provider, trying fallback...")
                    continue
                else:
                    logger.error(f"LLM API Error with model {model_name}: {response.status_code} - {response.text}")
                    reply_text = f"AI Provider Response Error ({response.status_code}): {response.text[:150]}"
                    break
            except Exception as e:
                logger.error(f"LLM exception with model {model_name}: {e}")
                reply_text = f"Hello! StudyMate Bot encountered a connection issue: {e}"
                break

        return {
            "reply": reply_text,
            "memory_context": memory_data,
            "user_id": user_id
        }
