import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

API_KEY = "sk_ijjzfhen_Cwenf03H9l469NGfqjTeHSad"

# Test Sarvam Translate / LLM
try:
    res = requests.post(
        "https://api.sarvam.ai/translate",
        headers={"api-subscription-key": API_KEY, "Content-Type": "application/json"},
        json={
            "input": "Hello, how are you?",
            "source_language_code": "en-IN",
            "target_language_code": "hi-IN",
            "speaker_gender": "Female",
            "mode": "formal"
        },
        timeout=10
    )
    print("Sarvam Translate Status:", res.status_code)
    print("Sarvam Translate Response:", res.json())
except Exception as e:
    print("Sarvam test error:", e)
