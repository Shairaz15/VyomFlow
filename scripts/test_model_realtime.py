import sys
import json
import time
import requests

sys.stdout.reconfigure(encoding='utf-8')

# Read .env for AI Assistant URL
env_url = None
try:
    with open(".env", "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("VITE_AI_ASSISTANT_URL="):
                env_url = line.strip().split("=", 1)[1].strip()
except Exception as e:
    print(f"Error reading .env: {e}")

print(f"Target AI Assistant Server URL from .env: {env_url}")

# Candidate endpoints to probe
endpoints = []
if env_url:
    endpoints.append(env_url)
endpoints.append("http://localhost:8000")

# Test health check
active_url = None
for url in endpoints:
    try:
        print(f"Probing {url}/health ...")
        res = requests.get(f"{url}/health", timeout=6)
        if res.status_code == 200:
            print(f"--> [SUCCESS] Connected to live AI Server at {url}!")
            print(f"--> Health Payload: {res.json()}")
            active_url = url
            break
        else:
            print(f"--> HTTP {res.status_code}")
    except Exception as e:
        print(f"--> Unreachable: {e}")

# Random & Out-of-Domain Test Queries
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
    }
]

print("\n" + "="*80)
print("EXECUTING MODEL TEST WITH RANDOM QUESTIONS")
print("="*80)

if active_url:
    print(f"Live Qwen 2.5 LLM server active at: {active_url}\n")
    for i, item in enumerate(RANDOM_TEST_QUESTIONS, 1):
        print(f"\n--- [Question {i}/{len(RANDOM_TEST_QUESTIONS)}] Category: {item['category']} ---")
        print(f"Prompt: \"{item['question']}\"")
        
        t0 = time.time()
        try:
            res = requests.post(
                f"{active_url}/api/chat",
                json={
                    "message": item["question"],
                    "context_page": "dashboard",
                    "language": "en"
                },
                timeout=30
            )
            elapsed = time.time() - t0
            if res.status_code == 200:
                data = res.json()
                reply = data.get("reply", "")
                print(f"Response ({elapsed:.2f}s):\n{reply}")
                
                # Verify if it's dynamic
                is_hardcoded = (
                    "In response to your question regarding" in reply or
                    "Reassurance: There are NO signs of dementia" in reply or
                    "Your current cognitive baseline is strong" in reply
                )
                if is_hardcoded:
                    print("--> [VERDICT]: Hardcoded / Fallback template returned.")
                else:
                    print("--> [VERDICT]: REAL DYNAMIC LLM INFERENCE GENERATED!")
            else:
                print(f"--> [ERROR] HTTP {res.status_code}: {res.text}")
        except Exception as e:
            print(f"--> [ERROR] Request failed: {e}")
else:
    print("\n[NOTE] Remote Cloudflare Tunnel / Local GPU Server is currently OFFLINE.")
    print("Simulating how the client fallback engine handles these random questions vs. live LLM:\n")
    
    # Simulate the client's generateLocalChatFallback
    def mock_local_fallback(msg: str):
        lower = msg.lower()
        if "dementia" in lower:
            return "Reassurance: There are NO signs of dementia in your assessment..."
        if "doctor" in lower:
            return "Top 3 Discussion Points for Your Doctor: 1. Are my current processing speed..."
        if "sleep" in lower or "fatigue" in lower:
            return "Sleep & Cognitive Stamina Optimization: Restorative Glymphatic Clearance..."
        if "food" in lower or "diet" in lower or "eat" in lower:
            return "Neuro-Nutritional Guidelines for Brain Vitality: Omega-3 Fatty Acids..."
        if "baseline" in lower or "compare" in lower:
            return "Longitudinal Baseline Comparison: Visual Retention +4.2%..."
        
        topic = f'"{msg[:45]}..."' if len(msg) > 25 else f'"{msg}"'
        return f"In response to your question regarding **{topic}**:\nYour current cognitive baseline is strong across all 6 core domains with preserved memory (86%), fast reaction speed (320ms)..."

    for i, item in enumerate(RANDOM_TEST_QUESTIONS, 1):
        print(f"\n--- [Question {i}/{len(RANDOM_TEST_QUESTIONS)}] Category: {item['category']} ---")
        print(f"Prompt: \"{item['question']}\"")
        fallback_output = mock_local_fallback(item["question"])
        print(f"Client Offline Fallback Behavior:\n{fallback_output}")
        print("--> [VERDICT]: When offline, the system falls back to heuristic rule matching.")
