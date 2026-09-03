import os
import subprocess
import imageio_ffmpeg
import shutil

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
video_dir = r"c:\Users\Sashank Raviraj\AppData\Roaming\Desktop\VyomFlow\public\videos\navigation"
input_path = os.path.join(video_dir, "res.mp4")
temp_output = os.path.join(video_dir, "res_45mb.mp4")

print(f"Compressing {input_path} (78MB) to ~40MB with CRF 28 for Supabase Storage...")

cmd = [
    ffmpeg_exe,
    "-y",
    "-i", input_path,
    "-vf", "scale=-2:720,fps=30",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "28",
    "-pix_fmt", "yuv420p",
    "-an",
    "-movflags", "+faststart",
    temp_output
]

res = subprocess.run(cmd, capture_output=True, text=True)

if res.returncode == 0 and os.path.exists(temp_output):
    new_size = os.path.getsize(temp_output) / (1024 * 1024)
    print(f"Success! Final Web Size: {new_size:.2f} MB")
    shutil.move(temp_output, input_path)
    print("Replaced res.mp4 with ultra-optimized faststart stream.")
else:
    print(f"Error:\n{res.stderr}")
