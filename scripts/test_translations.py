import os
import sys
import json
import urllib.request

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

api_key = os.environ.get("SARVAM_API_KEY") or "sk_jyptjv87_fsK6fkisYocrdYabftZOapZl"

LANG_MAP = {
    "hindi": "hi-IN",
    "bengali": "bn-IN",
    "tamil": "ta-IN",
    "telugu": "te-IN",
    "marathi": "mr-IN",
    "gujarati": "gu-IN",
    "kannada": "kn-IN",
    "malayalam": "ml-IN",
    "urdu": "ur-IN",
    "nepali": "ne-NP",
    "english_indian": "en-IN"
}

text = "Begin the assessment. Watch the pattern being displayed and try replicating it."

for lang_name, lang_code in LANG_MAP.items():
    if lang_name == "english_indian":
        print(f"[{lang_name}]: {text}")
        continue
    payload = json.dumps({
        "input": text,
        "source_language_code": "en-IN",
        "target_language_code": lang_code,
        "model": "sarvam-translate:v1"
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.sarvam.ai/translate",
        data=payload,
        headers={"api-subscription-key": api_key, "Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"[{lang_name}]: {data.get('translated_text')}")
    except Exception as e:
        print(f"[{lang_name}] Error: {e}")
