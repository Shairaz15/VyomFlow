"""
Script to automatically push and execute the VyomFlow AI Assistant GPU Kernel on Kaggle.
"""

import json
import time
import sys
import requests

sys.stdout.reconfigure(encoding='utf-8')

import os

KAGGLE_USERNAME = os.environ.get("KAGGLE_USERNAME", "sashankraviraj")
_kp = os.path.expanduser("~/.kaggle/kaggle.json")
_kd = json.load(open(_kp)) if os.path.exists(_kp) else {}
_raw_tok = os.environ.get("KAGGLE_TOKEN") or _kd.get("key", "")
KAGGLE_TOKEN = f"KGAT_{_raw_tok}" if _raw_tok and not _raw_tok.startswith("KGAT_") else _raw_tok
KERNEL_SLUG = "vyomflow-ai-assistant"

headers = {
    "Authorization": f"Bearer {KAGGLE_TOKEN}",
    "Content-Type": "application/json"
}

# 1. Read & Format Notebook Content
notebook_path = "scripts/VyomFlow_Kaggle_AI_Assistant.ipynb"
with open(notebook_path, "r", encoding="utf-8") as f:
    json_body = json.load(f)

for cell in json_body.get('cells', []):
    if 'outputs' in cell and cell['cell_type'] == 'code':
        cell['outputs'] = []
    if 'source' in cell and isinstance(cell['source'], list):
        cell['source'] = ''.join(cell['source'])

script_body = json.dumps(json_body)

payload = {
    "slug": f"{KAGGLE_USERNAME}/{KERNEL_SLUG}",
    "newTitle": "VyomFlow AI Assistant",
    "text": script_body,
    "language": "python",
    "kernelType": "notebook",
    "isPrivate": True,
    "enableGpu": True,
    "enableInternet": True,
    "datasetDataSources": [],
    "competitionDataSources": [],
    "kernelDataSources": [],
    "modelDataSources": []
}

print(f"🚀 Pushing notebook to Kaggle ({KAGGLE_USERNAME}/{KERNEL_SLUG}) with GPU + Internet enabled...")
res = requests.post("https://www.kaggle.com/api/v1/kernels/save", headers=headers, json=payload)
if res.status_code != 200:
    res = requests.post("https://www.kaggle.com/api/v1/kernels/push", headers=headers, json=payload)

print(f"Push Status Code: {res.status_code}")
print(f"Response: {res.text}")

if res.status_code == 200:
    print(f"\n✅ Kernel successfully pushed & scheduled to run on Kaggle GPU!")
    print(f"🔗 View in browser: https://www.kaggle.com/code/{KAGGLE_USERNAME}/{KERNEL_SLUG}")
    
    print("\n⏳ Monitoring kernel status...")
    for i in range(12):
        time.sleep(5)
        status_res = requests.get(f"https://www.kaggle.com/api/v1/kernels/status?userName={KAGGLE_USERNAME}&kernelSlug={KERNEL_SLUG}", headers=headers)
        if status_res.status_code == 200:
            status_data = status_res.json()
            print(f"[{i+1}/12] Status: {status_data.get('status')} | Message: {status_data.get('failureMessage')}")
            if status_data.get('status') in ['complete', 'error', 'cancelAcknowledged']:
                break
        else:
            print(f"Status check: {status_res.status_code}")
