import requests
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

url = "https://difficulties-surface-linking-risks.trycloudflare.com"
print(f"Testing {url}/health ...")
try:
    res = requests.get(f"{url}/health", timeout=10)
    print("Status code:", res.status_code)
    print("Payload:", res.json())
except Exception as e:
    print("Error:", e)
