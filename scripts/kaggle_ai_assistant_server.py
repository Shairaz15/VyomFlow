"""
================================================================================
VYOMFLOW MULTILINGUAL AI ASSISTANT SERVER (KAGGLE FREE GPU T4 / P100)
================================================================================
Instructions for Expo / Judges Presentation:
1. Open your Kaggle Notebook: https://www.kaggle.com/code
2. Set Accelerator: GPU T4 x 2 or GPU P100 | Internet: ON
3. Paste and run this script.
4. The server loads Qwen 2.5 7B into GPU VRAM and auto-registers with Supabase.
5. Your VyomFlow React Web App will instantly turn GREEN and connect!
================================================================================
"""

import os
import sys
import json
import time
import subprocess

# 1. Auto-install dependencies
try:
    import fastapi
    import uvicorn
    import torch
    from pycloudflared import try_cloudflare
    from supabase import create_client, Client
    from transformers import AutoModelForCausalLM, AutoTokenizer
except ImportError:
    print("🚀 Installing required packages (FastAPI, Transformers, PyTorch, pycloudflared, Supabase)...")
    subprocess.check_call([
        sys.executable, "-m", "pip", "install", "-q",
        "fastapi", "uvicorn", "transformers", "accelerate", "pycloudflared", "supabase", "pydantic", "torch"
    ])
    import fastapi
    import uvicorn
    import torch
    from pycloudflared import try_cloudflare
    from supabase import create_client, Client
    from transformers import AutoModelForCausalLM, AutoTokenizer

from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# 2. Initialize Supabase Connection
SUPABASE_URL = "https://pkkrxxjinpxctkoxltuy.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBra3J4eGppbnB4Y3Rrb3hsdHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MTUxNjMsImV4cCI6MjEwMzM5MTE2M30.eZ2Oj7ym61xITHJZANeCSRPZwv12v39blnfayNqQ5uM"
supabase: Optional[Client] = None
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Connected to Supabase successfully!")
except Exception as e:
    print(f"Supabase connect error: {e}")

# 3. Load High-Speed Multilingual LLM (Qwen 2.5 7B Instruct)
MODEL_ID = "Qwen/Qwen2.5-7B-Instruct"
print(f"
🚀 Loading {MODEL_ID} into GPU memory...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.float16,
    device_map="auto",
    trust_remote_code=True
)
model.eval()
print(f"✅ Qwen 2.5 7B Model loaded on GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'}!")

# 4. FastAPI Service Setup
app = FastAPI(title="VyomFlow Multilingual AI Assistant Engine", version="3.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi (हिंदी)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "ta": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)",
    "bn": "Bengali (বাংলা)",
    "mr": "Marathi (मराठी)",
    "gu": "Gujarati (ગુજરાતી)",
    "ml": "Malayalam (മലയാളം)",
    "pa": "Punjabi (ਪੰਜਾਬੀ)"
}

CLINICAL_GUARDRAILS = """
CLINICAL & ETHICAL BOUNDARIES (FDA SaMD ALIGNMENT):
- VyomFlow is a proactive cognitive health screening and digital biomarker tool.
- NEVER declare a definitive medical diagnosis (e.g., do not say 'You have Alzheimer's Disease'). Frame feedback around 'Observed Cognitive Patterns', 'Digital Biomarker Telemetry', and 'Longitudinal Baselines'.
- For patients and families: Warm, encouraging, strength-focused, easy-to-understand language.
- For clinicians: Statistical metrics, domain z-scores, RCI drift, and SHAP biomarker drivers.
"""

class DashboardInsightRequest(BaseModel):
    firebase_uid: Optional[str] = "demo_user"
    session_data: Optional[Dict[str, Any]] = None
    language: Optional[str] = "en"
    mode: Optional[str] = "patient"

class ModuleInsightRequest(BaseModel):
    module_type: str
    score: float
    raw_metrics: Optional[Dict[str, Any]] = None
    derived_features: Optional[Dict[str, Any]] = None
    biomarkers: Optional[Dict[str, Any]] = None
    language: Optional[str] = "en"
    user_demographics: Optional[Dict[str, Any]] = None

class ChatRequest(BaseModel):
    message: str
    context_page: Optional[str] = "dashboard"
    session_data: Optional[Dict[str, Any]] = None
    language: Optional[str] = "en"
    chat_history: Optional[List[Dict[str, str]]] = []

def generate_llm_response(messages: List[Dict[str, str]], max_tokens: int = 500, temperature: float = 0.5) -> str:
    prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            do_sample=True,
            temperature=temperature,
            top_p=0.9,
            pad_token_id=tokenizer.eos_token_id
        )
    generated = tokenizer.decode(output_ids[0][inputs.input_ids.shape[1]:], skip_special_tokens=True).strip()
    return generated

@app.get("/health")
def health():
    return {
        "status": "online",
        "model": MODEL_ID,
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU",
        "vram_allocated_gb": round(torch.cuda.memory_allocated(0) / 1024**3, 2) if torch.cuda.is_available() else 0
    }

@app.post("/api/insights/dashboard")
async def get_dashboard_insights(req: DashboardInsightRequest):
    try:
        data = req.session_data or {}
        lang_name = LANGUAGE_NAMES.get(req.language or "en", "English")
        lang_dir = f"CRITICAL: Respond COMPLETELY in natural, fluent {lang_name} native script." if req.language != "en" else "Respond in clear, empathetic English."
        
        if req.mode == "clinician":
            system_prompt = f"""You are the Senior Neuropsychological AI Consultant for VyomFlow.
{CLINICAL_GUARDRAILS}
{lang_dir}
Provide a structured clinical evaluation:
1. Executive Cognitive Summary (Estimated MoCA, battery coverage, risk score).
2. Domain Status Breakdown (Memory, Language, Executive, Speed, Spatial, Attention).
3. Longitudinal Stability & Drift (RCI, Theil-Sen slope).
4. Recommended Follow-up Protocol.
Keep it bulleted and actionable."""
        else:
            system_prompt = f"""You are Maya, the supportive AI Cognitive Health Guide for VyomFlow.
{CLINICAL_GUARDRAILS}
{lang_dir}
Structure your response in clear, friendly sections:
1. 🌟 Celebrating Your Strengths (What went well in your tests).
2. 💡 Understanding Focus Areas (A gentle, reassuring explanation of areas needing practice).
3. 🏃 3 Daily Action Steps (Fun brain exercises, physical movement, sleep tips).
4. 🩺 Questions for Your Doctor (2-3 helpful discussion points for your next checkup).
Keep paragraphs short and easy to read."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"User Assessment Session Results:\n{json.dumps(data, indent=2)}"}
        ]
        insights = generate_llm_response(messages, max_tokens=750, temperature=0.4)
        return {"insights": insights, "language": req.language, "mode": req.mode}
    except Exception as e:
        print(f"Dashboard generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/insights/module")
async def get_module_insights(req: ModuleInsightRequest):
    try:
        lang_name = LANGUAGE_NAMES.get(req.language or "en", "English")
        lang_dir = f"CRITICAL: Respond COMPLETELY in natural, fluent {lang_name} native script." if req.language != "en" else "Respond in clear, motivating English."
        
        system_prompt = f"""You are the VyomFlow Digital Biomarker Specialist.
Analyze the user's performance on the '{req.module_type.upper()}' assessment module.
{CLINICAL_GUARDRAILS}
{lang_dir}
Structure your response with:
1. 📊 Score & Telemetry Summary (Score: {req.score}/100).
2. 🔬 What the Telemetry Shows (Explain memory retention, speech pauses, reaction latency, or navigation efficiency in simple terms).
3. 🧠 2 Quick Brain Exercises to train this specific skill at home.
Keep it under 200 words."""

        payload = {
            "module": req.module_type,
            "score": req.score,
            "raw_metrics": req.raw_metrics or {},
            "derived_features": req.derived_features or {},
            "biomarkers": req.biomarkers or {}
        }
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Module Assessment Data:\n{json.dumps(payload, indent=2)}"}
        ]
        insights = generate_llm_response(messages, max_tokens=550, temperature=0.3)
        return {"insights": insights, "module": req.module_type, "language": req.language}
    except Exception as e:
        print(f"Module generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(req: ChatRequest):
    try:
        lang_name = LANGUAGE_NAMES.get(req.language or "en", "English")
        lang_dir = f"CRITICAL: Respond dynamically and helpfully in {lang_name} native script." if req.language != "en" else "Respond in clear, direct English."
        
        system_prompt = f"""You are Maya, the real-time AI Cognitive Health Copilot for VyomFlow.
{CLINICAL_GUARDRAILS}
{lang_dir}
Context: User is currently on the '{req.context_page}' page.
Session Telemetry: {json.dumps(req.session_data or {})}
Answer the user's question directly, intelligently, and helpfully. Do NOT give static repetitive answers. Answer any topic (whether general knowledge, brain health, calculation, translation, or daily advice) with precision and warmth. Keep under 200 words."""

        messages = [{"role": "system", "content": system_prompt}]
        for turn in (req.chat_history or []):
            if turn.get("user"):
                messages.append({"role": "user", "content": turn["user"]})
            if turn.get("assistant"):
                messages.append({"role": "assistant", "content": turn["assistant"]})
        messages.append({"role": "user", "content": req.message})

        reply = generate_llm_response(messages, max_tokens=450, temperature=0.6)
        return {"reply": reply, "language": req.language}
    except Exception as e:
        print(f"Chat generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 5. Start Server & Auto-Sync
def start_server():
    print("\n" + "="*70)
    print("🚀 STARTING VYOMFLOW AI ASSISTANT ON KAGGLE GPU")
    print("="*70)
    
    # Cloudflare Tunnel
    tunnel = try_cloudflare(port=8000)
    tunnel_url = tunnel.tunnel.rstrip('/')
    print("\n" + "*"*70)
    print(f"✨ PUBLIC HTTPS API URL: {tunnel_url}")
    print("*"*70)

    # Supabase Auto-Registration
    if supabase:
        try:
            supabase.table("users").upsert({
                "firebase_uid": "system_ai_config",
                "email": "ai_server@vyomflow.com",
                "full_name": tunnel_url
            }).execute()
            print(f"🎉 Auto-registered live URL in Supabase: {tunnel_url}")
        except Exception as e:
            print(f"Supabase note: {e}")

    # Start FastAPI
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    start_server()
