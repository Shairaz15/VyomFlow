import sys
sys.stdout.reconfigure(encoding='utf-8')
from supabase import create_client

SUPABASE_URL = "https://pkkrxxjinpxctkoxltuy.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBra3J4eGppbnB4Y3Rrb3hsdHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MTUxNjMsImV4cCI6MjEwMzM5MTE2M30.eZ2Oj7ym61xITHJZANeCSRPZwv12v39blnfayNqQ5uM"

try:
    supa = create_client(SUPABASE_URL, SUPABASE_KEY)
    res = supa.table("users").select("*").eq("firebase_uid", "system_ai_config").execute()
    print("Supabase system_ai_config record:")
    print(res.data)
except Exception as e:
    print(f"Error querying Supabase: {e}")
