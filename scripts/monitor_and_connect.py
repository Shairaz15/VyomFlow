"""
Monitors Kaggle Kernel output and automatically updates .env when the Cloudflare Tunnel URL appears.
"""

import os
import re
import sys
import time
import requests

sys.stdout.reconfigure(encoding='utf-8')

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

def update_env_file(tunnel_url: str):
    env_path = ".env"
    lines = []
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    
    updated = False
    new_lines = []
    for line in lines:
        if line.startswith("VITE_AI_ASSISTANT_URL="):
            new_lines.append(f"VITE_AI_ASSISTANT_URL={tunnel_url}\n")
            updated = True
        else:
            new_lines.append(line)
            
    if not updated:
        new_lines.append(f"\nVITE_AI_ASSISTANT_URL={tunnel_url}\n")
        
    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
        
    print(f"\n🎉 Successfully updated .env with VITE_AI_ASSISTANT_URL={tunnel_url}!")

print("🔍 Monitoring Kaggle GPU execution...")

for attempt in range(1, 30):
    try:
        # Check Status
        s_res = requests.get(f"https://www.kaggle.com/api/v1/kernels/status?userName={KAGGLE_USERNAME}&kernelSlug={KERNEL_SLUG}", headers=headers)
        status = s_res.json().get('status', 'unknown') if s_res.status_code == 200 else 'error'
        
        # Check Output
        o_res = requests.get(f"https://www.kaggle.com/api/v1/kernels/output?userName={KAGGLE_USERNAME}&kernelSlug={KERNEL_SLUG}", headers=headers)
        if o_res.status_code == 200:
            log_entries = o_res.json().get('log', [])
            all_text = ''.join([item.get('data', '') for item in log_entries])
            
            # Look for trycloudflare.com
            match = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', all_text)
            if match:
                tunnel_url = match.group(0)
                print(f"\n✨ FOUND CLOUDFLARE TUNNEL URL: {tunnel_url}")
                update_env_file(tunnel_url)
                
                # Test Health
                try:
                    h_res = requests.get(f"{tunnel_url}/health", timeout=10)
                    print(f"Health check status: {h_res.status_code}, payload: {h_res.json()}")
                except Exception as ex:
                    print(f"Health check note: {ex}")
                sys.exit(0)
                
            print(f"[{attempt}/30] Kaggle Status: {status} | Logs received: {len(all_text)} chars")
            if len(all_text) > 0:
                print("Latest Log snippet:", all_text[-300:].strip())
        else:
            print(f"[{attempt}/30] Status: {status}")
            
    except Exception as e:
        print(f"Error checking: {e}")
        
    time.sleep(10)

print("\nStill running in background. You can also view outputs directly on Kaggle:")
print(f"https://www.kaggle.com/code/{KAGGLE_USERNAME}/{KERNEL_SLUG}")
