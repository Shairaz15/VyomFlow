import os
import subprocess
import imageio_ffmpeg
import shutil

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
video_dir = r"c:\Users\Sashank Raviraj\AppData\Roaming\Desktop\VyomFlow\public\videos\navigation"
input_path = os.path.join(video_dir, "res.mp4")
backup_path = os.path.join(video_dir, "res.raw.bak.mp4")
temp_output = os.path.join(video_dir, "res_web.mp4")

if not os.path.exists(backup_path):
    print("Backing up raw 1GB video...")
    shutil.copy2(input_path, backup_path)

print(f"Compressing {backup_path} (1GB) to 720p 30fps faststart H.264...")

cmd = [
    ffmpeg_exe,
    "-y",
    "-i", backup_path,
    "-vf", "scale=-2:720,fps=30",
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "24",
    "-pix_fmt", "yuv420p",
    "-an", # Remove audio track
    "-movflags", "+faststart",
    temp_output
]

res = subprocess.run(cmd, capture_output=True, text=True)

if res.returncode == 0 and os.path.exists(temp_output):
    new_size = os.path.getsize(temp_output) / (1024 * 1024)
    print(f"Compression complete! New size: {new_size:.2f} MB")
    
    # Overwrite local res.mp4
    shutil.move(temp_output, input_path)
    print("Replaced local res.mp4 with optimized web version.")
else:
    print(f"FFmpeg error:\n{res.stderr}")
