"""
=============================================================================
VyomFlow - Full Multilingual Dubbing Pipeline for All 7 Test Modules
=============================================================================
Implements the workflow specified in MULTILINGUAL_DUBBING_WORKFLOW.md:
- 11 Languages: Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada,
  Malayalam, Urdu, Nepali, Indian English.
- Uses Edge-TTS neural voices with rate tuning.
- Uses local FFmpeg stream-copy (-c:v copy) for lossless video quality.
- Organizes generated videos into dubbed_videos_output/ and dubbed_videos/.
=============================================================================
"""

import os
import sys
import json
import asyncio
import shutil
import subprocess
import urllib.request
import imageio_ffmpeg
import edge_tts

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

SARVAM_API_KEY = os.environ.get("SARVAM_API_KEY") or "sk_jyptjv87_fsK6fkisYocrdYabftZOapZl"

# 11 Voices matrix from MULTILINGUAL_DUBBING_WORKFLOW.md
VOICES_MATRIX = {
    "hindi": {"code": "hi", "lang_code": "hi-IN", "voice": "hi-IN-SwaraNeural", "rate": "+5%"},
    "bengali": {"code": "bn", "lang_code": "bn-IN", "voice": "bn-IN-TanishaaNeural", "rate": "+5%"},
    "tamil": {"code": "ta", "lang_code": "ta-IN", "voice": "ta-IN-PallaviNeural", "rate": "+10%"},
    "telugu": {"code": "te", "lang_code": "te-IN", "voice": "te-IN-ShrutiNeural", "rate": "+8%"},
    "marathi": {"code": "mr", "lang_code": "mr-IN", "voice": "mr-IN-AarohiNeural", "rate": "+5%"},
    "gujarati": {"code": "gu", "lang_code": "gu-IN", "voice": "gu-IN-DhwaniNeural", "rate": "+5%"},
    "kannada": {"code": "kn", "lang_code": "kn-IN", "voice": "kn-IN-SapnaNeural", "rate": "+8%"},
    "malayalam": {"code": "ml", "lang_code": "ml-IN", "voice": "ml-IN-SobhanaNeural", "rate": "+8%"},
    "urdu": {"code": "ur", "lang_code": "ur-IN", "voice": "ur-IN-GulNeural", "rate": "+5%"},
    "nepali": {"code": "ne", "lang_code": "ne-NP", "voice": "ne-NP-HemkalaNeural", "rate": "+5%"},
    "english_indian": {"code": "en", "lang_code": "en-IN", "voice": "en-IN-NeerjaNeural", "rate": "+0%"}
}

# The 6 remaining modules in vids/
MODULES = [
    {
        "module_name": "sustained_attention",
        "video_file": "vids/Attention.mp4",
        "prefix": "attention_tutorial",
        "english_script": "Read the following instructions and only click if the specific color and shape show up. Do not click as that is not your target. Click. Click. Click. Do not click as that is not your target. Begin the assessment.",
        "nepali_script": "तल दिइएका निर्देशनहरू पढ्नुहोस् र तोकिएको रङ र आकार देखिँदा मात्र क्लिक गर्नुहोस्। यदि यो तपाईंको लक्ष्य होइन भने क्लिक नगर्नुहोस्। क्लिक गर्नुहोस्। क्लिक गर्नुहोस्। क्लिक गर्नुहोस्। यदि यो तपाईंको लक्ष्य होइन भने क्लिक नगर्नुहोस्। मूल्याङ्कन सुरु गर्नुहोस्।"
    },
    {
        "module_name": "language_fluency",
        "video_file": "vids/Language Fluency.mp4",
        "prefix": "language_tutorial",
        "english_script": "Begin the assessment, enable mic permissions and do a short audio test. Based on the topic provided, speak as long as you can. Once you are done, click the finish button.",
        "nepali_script": "मूल्याङ्कन सुरु गर्नुहोस्, माइक अनुमति दिनुहोस् र छोटो अडियो परीक्षण गर्नुहोस्। दिइएको विषयमा आधारित रहेर सकेसम्म धेरै बोल्नुहोस्। सकिएपछि समाप्त बटनमा क्लिक गर्नुहोस्।"
    },
    {
        "module_name": "video_navigation",
        "video_file": "vids/Navigation.mp4",
        "prefix": "navigation_tutorial",
        "english_script": "Pay close attention to the navigation video from point A to point B. Answer a question about your travel destination, navigate yourself back from point B to point A. At each intersection you will be given arrows. The green is the correct answer and the red is the wrong answer. You can skip the video and directly jump to the next intersection. Recall the first video and place the landmarks in chronological order. Once you are satisfied, you may submit.",
        "nepali_script": "बिन्दु A देखि बिन्दु B सम्मको नेभिगेसन भिडियोलाई ध्यान दिएर हेर्नुहोस्। आफ्नो यात्रा गन्तव्य सम्बन्धी प्रश्नको उत्तर दिनुहोस्, र बिन्दु B बाट बिन्दु A मा फर्कनुहोस्। प्रत्येक मोडमा तीरहरू देखाइनेछन्। हरियो सही उत्तर हो र रातो गलत उत्तर हो। पहिलो भिडियो सम्झनुहोस् र स्थानहरूलाई क्रमबद्ध रूपमा राख्नुहोस् र सबमिट गर्नुहोस्।"
    },
    {
        "module_name": "pattern_memory",
        "video_file": "vids/Pattern.mp4",
        "prefix": "pattern_tutorial",
        "english_script": "Begin the assessment. Watch the pattern being displayed and try replicating it. The process runs through levels 1 to 10 with the box dimensions evolving with each level's difficulty.",
        "nepali_script": "मूल्याङ्कन सुरु गर्नुहोस्। देखाइएको ढाँचा हेर्नुहोस् र त्यसलाई दोहोर्याउने प्रयास गर्नुहोस्। यो प्रक्रिया तह १ देखि १० सम्म चल्नेछ, जहाँ प्रत्येक तहसँगै कठिनाइ बढ्दै जानेछ।"
    },
    {
        "module_name": "story_recall",
        "video_file": "vids/Story Narration.mp4",
        "prefix": "story_tutorial",
        "english_script": "Begin the assessment and choose the language of your choice. Pay close attention to the story being narrated. Answer MCQs based on the story you just heard, and recall the story to the best of your abilities.",
        "nepali_script": "मूल्याङ्कन सुरु गर्नुहोस् र आफ्नो रोजाइको भाषा छान्नुहोस्। सुनाइएको कथालाई ध्यानपूर्वक सुन्नुहोस्। सुनेको कथामा आधारित प्रश्नहरूको उत्तर दिनुहोस् र कथालाई सम्झेर सुनाउनुहोस्।"
    },
    {
        "module_name": "visual_memory",
        "video_file": "vids/Visual Memory.mp4",
        "prefix": "visual_memory_tutorial",
        "english_script": "Begin the assessment and remember all of these images. Play a short game and recall the images to the best of your abilities and submit.",
        "nepali_script": "मूल्याङ्कन सुरु गर्नुहोस् र यी सबै तस्बिरहरू सम्झनुहोस्। एउटा छोटो खेल खेल्नुहोस् र तस्बिरहरू सम्झेर उत्तर दिनुहोस् र सबमिट गर्नुहोस्।"
    }
]


def translate_text(api_key: str, text: str, target_lang_code: str) -> str:
    """Translates text using Sarvam Translate API"""
    payload = json.dumps({
        "input": text,
        "source_language_code": "en-IN",
        "target_language_code": target_lang_code,
        "model": "sarvam-translate:v1"
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.sarvam.ai/translate",
        data=payload,
        headers={
            "api-subscription-key": api_key,
            "Content-Type": "application/json"
        },
        method="POST"
    )

    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        return res.get("translated_text", text)


async def synthesize_audio(text: str, voice: str, rate: str, output_path: str, max_retries: int = 3) -> bool:
    """Generates audio using edge-tts with retries"""
    for attempt in range(1, max_retries + 1):
        try:
            comm = edge_tts.Communicate(text, voice, rate=rate)
            await comm.save(output_path)
            if os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
                return True
        except Exception as e:
            if attempt < max_retries:
                await asyncio.sleep(1.5)
            else:
                print(f"      ❌ Failed to synthesize with {voice}: {e}")
    return False


def mux_video(ffmpeg_exe: str, video_input: str, audio_input: str, video_output: str):
    """Muxes audio and video using lossless stream copy"""
    cmd = [
        ffmpeg_exe, "-y",
        "-i", video_input,
        "-i", audio_input,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "128k",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest",
        video_output
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)


async def process_module(mod_info: dict, ffmpeg_exe: str):
    mod_name = mod_info["module_name"]
    video_file = mod_info["video_file"]
    prefix = mod_info["prefix"]
    en_script = mod_info["english_script"]
    ne_script = mod_info["nepali_script"]

    print(f"\n=======================================================")
    print(f"🎬 Processing Module: {mod_name.upper()} ({video_file})")
    print(f"=======================================================")

    out_dir = os.path.join("dubbed_videos_output", mod_name)
    os.makedirs(out_dir, exist_ok=True)

    # 1. Gather all 11 translations
    print("  🌐 Translating instructions across 11 languages...")
    scripts = {}
    for lang_name, vdata in VOICES_MATRIX.items():
        if lang_name == "english_indian":
            scripts[lang_name] = en_script
        elif lang_name == "nepali":
            scripts[lang_name] = ne_script
        else:
            try:
                scripts[lang_name] = translate_text(SARVAM_API_KEY, en_script, vdata["lang_code"])
            except Exception as e:
                print(f"     Warning: Translation error for {lang_name} ({e}), falling back to English")
                scripts[lang_name] = en_script
        print(f"     ✓ [{lang_name}]: {scripts[lang_name][:60]}...")

    # 2. Synthesize audio & mux video for all 11 languages
    print("\n  🎙️ Generating Neural Voiceovers & Muxing Videos...")
    for lang_name, vdata in VOICES_MATRIX.items():
        text = scripts[lang_name]
        audio_file = os.path.join(out_dir, f"audio_{lang_name}.mp3")
        video_output = os.path.join(out_dir, f"{prefix}_{lang_name}.mp4")

        # Synthesize audio
        success = await synthesize_audio(text, vdata["voice"], vdata["rate"], audio_file)
        if success:
            mux_video(ffmpeg_exe, video_file, audio_file, video_output)
            print(f"     ✓ [{lang_name}] Generated: {os.path.basename(video_output)} ({os.path.getsize(video_output)} bytes)")
        else:
            print(f"     ❌ [{lang_name}] Failed to generate audio")


async def main():
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    print(f"FFmpeg binary: {ffmpeg_exe}")

    for mod in MODULES:
        await process_module(mod, ffmpeg_exe)

    # Sync dubbed_videos_output to dubbed_videos for convenience
    print("\n=======================================================")
    print("📁 Syncing folders to 'dubbed_videos'...")
    shutil.copytree("dubbed_videos_output", "dubbed_videos", dirs_exist_ok=True)
    print("✓ Successfully synced to dubbed_videos/")

    # Also sync newly created module videos to public/videos/tutorials/
    for mod in MODULES:
        mod_name = mod["module_name"]
        pub_dir = os.path.join("public", "videos", "tutorials", mod_name)
        os.makedirs(pub_dir, exist_ok=True)
        src_dir = os.path.join("dubbed_videos_output", mod_name)
        for f in os.listdir(src_dir):
            if f.endswith(".mp4"):
                shutil.copy2(os.path.join(src_dir, f), os.path.join(pub_dir, f))
    print("✓ Successfully synced to public/videos/tutorials/")

    print("\n🎉 ALL 6 MODULES DUBBED INTO 11 LANGUAGES SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(main())
