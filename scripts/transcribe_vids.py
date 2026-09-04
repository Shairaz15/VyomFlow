import os
import sys
import json
import subprocess
import urllib.request
import imageio_ffmpeg

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

exe = imageio_ffmpeg.get_ffmpeg_exe()
api_key = os.environ.get("SARVAM_API_KEY") or "sk_jyptjv87_fsK6fkisYocrdYabftZOapZl"
vids_dir = "vids"
results = {}

for f in sorted(os.listdir(vids_dir)):
    if not f.endswith(".mp4"):
        continue
    vpath = os.path.join(vids_dir, f)
    apath = f"temp_{f}.wav"
    cmd = [exe, "-y", "-i", vpath, "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", apath]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    
    with open(apath, "rb") as af:
        adata = af.read()
        
    boundary = "----WebKitFormBoundaryTrans7MA4"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="audio.wav"\r\n'
        f"Content-Type: audio/wav\r\n\r\n"
    ).encode("utf-8") + adata + (
        f"\r\n--{boundary}\r\n"
        f'Content-Disposition: form-data; name="model"\r\n\r\n'
        f"saarika:v2.5\r\n"
        f"--{boundary}--\r\n"
    ).encode("utf-8")

    req = urllib.request.Request(
        "https://api.sarvam.ai/speech-to-text",
        data=body,
        headers={
            "api-subscription-key": api_key,
            "Content-Type": f"multipart/form-data; boundary={boundary}"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            results[f] = data.get("transcript", "")
            print(f"[{f}]: {results[f]}")
    except Exception as e:
        print(f"[{f}] Error: {e}")
    finally:
        if os.path.exists(apath):
            os.remove(apath)

with open("vids_transcripts.json", "w", encoding="utf-8") as out:
    json.dump(results, out, indent=2, ensure_ascii=False)
print("Saved vids_transcripts.json successfully!")
