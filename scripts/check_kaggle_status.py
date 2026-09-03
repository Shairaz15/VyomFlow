import requests
import json
import sys

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

# Check Status
s_res = requests.get(f"https://www.kaggle.com/api/v1/kernels/status?userName={KAGGLE_USERNAME}&kernelSlug={KERNEL_SLUG}", headers=headers)
print("Status Response:", s_res.status_code, s_res.json() if s_res.status_code == 200 else s_res.text)

# Check Output
o_res = requests.get(f"https://www.kaggle.com/api/v1/kernels/output?userName={KAGGLE_USERNAME}&kernelSlug={KERNEL_SLUG}", headers=headers)
if o_res.status_code == 200:
    data = o_res.json()
    logs = data.get('log', [])
    print(f"Total log items: {len(logs)}")
    for item in logs[-15:]:
        print(item.get('data', '').strip())
else:
    print("Output Response:", o_res.status_code, o_res.text)
