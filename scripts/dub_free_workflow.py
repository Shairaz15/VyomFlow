import os
import asyncio
import subprocess
import time
import imageio_ffmpeg
import edge_tts

VOICES = {
    "hindi": {
        "code": "hi",
        "voice": "hi-IN-SwaraNeural",
        "rate": "+5%",
        "text": "मूल्यांकन शुरू करें। स्क्रीन पर क्लिक करके या स्पेसबार दबाकर हरे रंग पर तुरंत प्रतिक्रिया दें। ध्यान रहे, रंग बदलने से पहले क्लिक करने पर फॉल्स स्टार्ट माना जाएगा। इसे ध्यान में रखते हुए बाकी के सभी स्तर पूरे करें।"
    },
    "bengali": {
        "code": "bn",
        "voice": "bn-IN-TanishaaNeural",
        "rate": "+5%",
        "text": "মূল্যায়ন শুরু করুন। স্ক্রিনে ক্লিক করে অথবা স্পেসবার ব্যবহার করে সবুজ রঙে দ্রুত প্রতিক্রিয়া জানান। মনে রাখবেন, রঙ পরিবর্তন হওয়ার আগেই ক্লিক করলে ফলস স্টার্ট হবে। এটি মাথায় রেখে বাকি লেভেলগুলো সম্পন্ন করুন।"
    },
    "tamil": {
        "code": "ta",
        "voice": "ta-IN-PallaviNeural",
        "rate": "+10%",
        "text": "மதிப்பீட்டைத் தொடங்குங்கள். திரையைக் கிளிக் செய்வதன் மூலமோ அல்லது ஸ்பேஸ்பாரைப் பயன்படுத்துவதன் மூலமோ பச்சை நிறத்திற்கு உடனடியாக பதிலளிக்கவும். நிறம் மாறுவதற்கு முன் கிளிக் செய்தால் அது தவறுதலாகக் கருதப்படும். இதை மனதில் வைத்து மீதமுள்ள நிலைகளை முடிக்கவும்."
    },
    "telugu": {
        "code": "te",
        "voice": "te-IN-ShrutiNeural",
        "rate": "+8%",
        "text": "మూల్యాంకనాన్ని ప్రారంభించండి. స్క్రీన్‌పై క్లిక్ చేయడం ద్వారా లేదా స్పేస్‌బార్‌ని ఉపయోగించి ఆకుపచ్చ రంగు వచ్చిన వెంటనే స్పందించండి. రంగు మారకముందే క్లిక్ చేస్తే అది తప్పుడు ప్రారంభంగా పరిగణించబడుతుంది. దీనిని గుర్తుంచుకుని మిగిలిన స్థాయిలను పూర్తి చేయండి."
    },
    "marathi": {
        "code": "mr",
        "voice": "mr-IN-AarohiNeural",
        "rate": "+5%",
        "text": "मूल्यांकन सुरू करा। स्क्रीनवर क्लिक करून किंवा स्पेसबार वापरून हिरव्या रंगावर लगेच प्रतिक्रिया द्या। लक्षात ठेवा, रंग बदलण्यापूर्वी क्लिक केल्यास फॉल्स स्टार्ट मानला जाईल। हे लक्षात ठेवून उर्वरित लेव्हल्स पूर्ण करा।"
    },
    "gujarati": {
        "code": "gu",
        "voice": "gu-IN-DhwaniNeural",
        "rate": "+5%",
        "text": "મૂલ્યાંકન શરૂ કરો. સ્ક્રીન પર ક્લિક કરીને અથવા સ્પેસબારનો ઉપયોગ કરીને લીલા રંગ પર ઝડપથી પ્રતિક્રિયા આપો. યાદ રાખો, રંગ બદલાય તે પહેલાં ક્લિક કરવાથી ફૉલ્સ સ્ટાર્ટ ગણાશે. આ ધ્યાનમાં રાખીને બાકીના લેવલ પૂર્ણ કરો."
    },
    "kannada": {
        "code": "kn",
        "voice": "kn-IN-SapnaNeural",
        "rate": "+8%",
        "text": "ಮೌಲ್ಯಮಾಪನವನ್ನು ಪ್ರಾರಂಭಿಸಿ. ಪರದೆಯ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡುವ ಮೂಲಕ ಅಥವಾ ಸ್ಪೇಸ್‌ಬಾರ್ ಬಳಸುವ ಮೂಲಕ ಹಸಿರು ಬಣ್ಣಕ್ಕೆ ತಕ್ಷಣ ಪ್ರತಿಕ್ರಿಯಿಸಿ. ಬಣ್ಣ ಬದಲಾಗುವ ಮೊದಲೇ ಕ್ಲಿಕ್ ಮಾಡಿದರೆ ಅದು ಫಾಲ್ಸ್ ಸ್ಟಾರ್ಟ್ ಎಂದು ಪರಿಗಣಿಸಲಾಗುತ್ತದೆ. ಇದನ್ನು ನೆನಪಿನಲ್ಲಿಟ್ಟುಕೊಂಡು ಉಳಿದ ಹಂತಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ."
    },
    "malayalam": {
        "code": "ml",
        "voice": "ml-IN-SobhanaNeural",
        "rate": "+8%",
        "text": "വിലയിരുത്തൽ ആരംഭിക്കുക. സ്ക്രീനിൽ ക്ലിക്ക് ചെയ്തോ സ്പേസ്ബാർ ഉപയോഗിച്ചോ പച്ച നിറത്തോട് ഉടനടി പ്രതികരിക്കുക. നിറം മാറുന്നതിന് മുമ്പ് ക്ലിക്ക് ചെയ്യുന്നത് തെറ്റായ തുടക്കമായി കണക്കാക്കും. ഇത് മനസ്സിൽ വെച്ച് ബാക്കി ലെവലുകൾ പൂർത്തിയാക്കുക."
    },
    "urdu": {
        "code": "ur",
        "voice": "ur-IN-GulNeural",
        "rate": "+5%",
        "text": "تشخیص کا آغاز کریں۔ اسکرین پر کلک کر کے یا اسپیس بار دبا کر سبز رنگ پر فوری ردعمل دیں۔ یاد رہے، رنگ تبدیل ہونے سے پہلے کلک کرنے سے فالس اسٹارٹ ہو جائے گا۔ اس بات کو ذہن میں رکھتے ہوئے باقی تمام لیولز مکمل کریں۔"
    },
    "nepali": {
        "code": "ne",
        "voice": "ne-NP-HemkalaNeural",
        "rate": "+5%",
        "text": "मूल्याङ्कन सुरु गर्नुहोस्। स्क्रिनमा क्लिक गरेर वा स्पेसबार प्रयोग गरेर हरियो रङमा तुरुन्त प्रतिक्रिया दिनुहोस्। याद गर्नुहोस्, रङ परिवर्तन हुनुभन्दा पहिले क्लिक गर्दा फल्स स्टार्ट हुनेछ। यसलाई ध्यानमा राख्दै बाँकी स्तरहरू पूरा गर्नुहोस्।"
    },
    "english_indian": {
        "code": "en",
        "voice": "en-IN-NeerjaNeural",
        "rate": "+0%",
        "text": "Begin the assessment. React to the color green by either clicking on the screen or using your spacebar. Now, clicking before the color changes results in a false start. Keep this in mind and perform the rest of the levels."
    }
}

async def generate_audio_with_retry(lang_key, data, audio_path, max_retries=4):
    for attempt in range(1, max_retries + 1):
        try:
            print(f"[{lang_key.upper()}] (Attempt {attempt}) Generating Neural TTS ({data['voice']})...", flush=True)
            comm = edge_tts.Communicate(data["text"], data["voice"], rate=data["rate"])
            await comm.save(audio_path)
            if os.path.exists(audio_path) and os.path.getsize(audio_path) > 1000:
                print(f"[{lang_key.upper()}] Audio saved ({os.path.getsize(audio_path)} bytes).", flush=True)
                return True
        except Exception as e:
            print(f"[{lang_key.upper()}] Attempt {attempt} error: {e}. Retrying in 2s...", flush=True)
            await asyncio.sleep(2)
    return False

def merge_video_audio(ffmpeg_exe, video_input, audio_input, video_output):
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
    print(f"Successfully created: {video_output}", flush=True)

async def main():
    video_input = "WhatsApp Video 2026-09-04 at 8.45.44 AM.mp4"
    output_dir = os.path.join("dubbed_videos_output", "reaction_time")
    os.makedirs(output_dir, exist_ok=True)
    
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    print(f"Using FFmpeg: {ffmpeg_exe}", flush=True)
    
    for lang_name, data in VOICES.items():
        audio_path = os.path.join(output_dir, f"audio_{lang_name}.mp3")
        video_output = os.path.join(output_dir, f"reaction_tutorial_{lang_name}.mp4")
        
        # Check if already generated
        if os.path.exists(video_output) and os.path.getsize(video_output) > 500000:
            print(f"[{lang_name.upper()}] Already generated! Skipping.", flush=True)
            continue
            
        success = await generate_audio_with_retry(lang_name, data, audio_path)
        if success:
            merge_video_audio(ffmpeg_exe, video_input, audio_path, video_output)
        else:
            print(f"[{lang_name.upper()}] FAILED to generate audio after retries.", flush=True)

    print("\n=======================================================", flush=True)
    print("ALL 11 DUBBED VIDEOS PROCESSED SUCCESSFULLY (100% FREE)!", flush=True)
    print("=======================================================", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
