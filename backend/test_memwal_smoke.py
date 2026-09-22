"""
MemWal SDK smoke test — verify health, remember, and recall work.
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
django.setup()

from apps.memory.services import WalrusMemoryService


def main():
    service = WalrusMemoryService()
    test_user = "smoke_test_user"

    print("=" * 60, flush=True)
    print("MemWal SDK Smoke Test", flush=True)
    print("=" * 60, flush=True)

    # 1. Health check
    print("\n[1/3] Health check...", flush=True)
    try:
        healthy = service.health_check(test_user)
        print(f"  [+] MemWal health: {healthy}", flush=True)
    except Exception as e:
        print(f"  [-] Health check FAILED: {e}", flush=True)
        return

    # 2. Remember facts
    print("\n[2/3] Storing test facts...", flush=True)
    test_facts = [
        "Student knows Python basics",
        "Student is studying graph algorithms",
        "Student struggles with Dijkstra's algorithm",
    ]
    try:
        result = service.remember_facts(test_user, test_facts)
        print(f"  [+] Stored {len(result['stored'])} facts", flush=True)
        for f in result['stored']:
            print(f"     -> {f}", flush=True)
        if result['errors']:
            print(f"  [!] {len(result['errors'])} errors:", flush=True)
            for err in result['errors']:
                print(f"     -> {err}", flush=True)
    except Exception as e:
        print(f"  [-] Remember FAILED: {e}", flush=True)
        return

    # 3. Recall
    print("\n[3/3] Recalling memories...", flush=True)
    try:
        memories = service.recall_memories(test_user, "What does the student know?")
        print(f"  [+] Recalled {len(memories)} memories", flush=True)
        for m in memories:
            dist = f" (dist: {m['distance']})" if m.get('distance') else ""
            print(f"     -> {m['text']}{dist}", flush=True)
    except Exception as e:
        print(f"  [-] Recall FAILED: {e}", flush=True)
        return

    print("\n" + "=" * 60, flush=True)
    print("All smoke tests passed!", flush=True)
    print("=" * 60, flush=True)


if __name__ == "__main__":
    main()
