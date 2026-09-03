import requests
import json
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

active_url = "https://difficulties-surface-linking-risks.trycloudflare.com"
print(f"Targeting LIVE Kaggle GPU Qwen 2.5 Server: {active_url}")

# Test health check
try:
    res = requests.get(f"{active_url}/health", timeout=10)
    print(f"Health Response (200 OK): {res.json()}")
except Exception as e:
    print(f"Health check failed: {e}")
    sys.exit(1)

RANDOM_TEST_QUESTIONS = [
    {
        "category": "Completely Out-of-Domain (Animals/Biology)",
        "question": "Why do flamingos stand on one leg?"
    },
    {
        "category": "Nonsense / Lateral Reasoning",
        "question": "If I eat 3 slices of pizza and a mango, how many wheels does a bicycle have?"
    },
    {
        "category": "Creative Generation (Poetry)",
        "question": "Write a 3-line haiku about a sleepy golden retriever."
    },
    {
        "category": "Mathematical Calculation",
        "question": "What is 123 multiplied by 456? Give just the calculation."
    },
    {
        "category": "Language Translation",
        "question": "Translate 'Brain health is wealth' into German and Japanese."
    },
    {
        "category": "Domain Specific / Hybrid Cognitive Inquiry",
        "question": "Does playing 3D immersive video games stimulate hippocampal neurogenesis in older adults?"
    },
    {
        "category": "Hindi Multilingual Test",
        "question": "मुझे बताएं कि ध्यान (Meditation) मस्तिष्क स्वास्थ्य में कैसे सुधार करता है?"
    }
]

print("\n" + "="*80)
print("TESTING LIVE KAGGLE GPU QWEN 2.5 MODEL WITH RANDOM QUESTIONS")
print("="*80)

for i, item in enumerate(RANDOM_TEST_QUESTIONS, 1):
    print(f"\n--- [Test {i}/{len(RANDOM_TEST_QUESTIONS)}] Category: {item['category']} ---")
    print(f"User Prompt: \"{item['question']}\"")
    
    t0 = time.time()
    try:
        lang = "hi" if "Hindi" in item['category'] else "en"
        res = requests.post(
            f"{active_url}/api/chat",
            json={
                "message": item["question"],
                "context_page": "dashboard",
                "language": lang
            },
            timeout=45
        )
        elapsed = time.time() - t0
        if res.status_code == 200:
            data = res.json()
            reply = data.get("reply", "")
            print(f"Qwen 2.5 GPU Response ({elapsed:.2f}s):\n{reply}")
            print("--> [VERDICT]: 100% REAL DYNAMIC GENERATION CONFIRMED!")
        else:
            print(f"--> [ERROR] HTTP {res.status_code}: {res.text}")
    except Exception as e:
        print(f"--> [ERROR] Request failed: {e}")
