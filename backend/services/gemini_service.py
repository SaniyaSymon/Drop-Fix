import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

load_dotenv(Path(__file__).parent.parent / '.env')


def get_llm_key() -> str:
    return os.environ.get("EMERGENT_LLM_KEY", "")

async def structure_voice_transcript(
    transcript: str,
    language_code: str = "en",
    selected_state: Optional[str] = None
) -> Dict[str, Any]:
    """
    Uses Gemini 3.5 Flash through emergentintegrations to parse spoken or typed water quality
    complaints into structured civic report fields with cautious preliminary assessment and safety guidance.
    """
    EMERGENT_LLM_KEY = get_llm_key()
    if not EMERGENT_LLM_KEY:
        logger.warning("EMERGENT_LLM_KEY is not configured; using fallback structuring.")
        return fallback_structuring(transcript, language_code, selected_state)

    system_prompt = (
        "You are the DROPFIX AI Civic Assistant for South India water quality and citizen safety. "
        "Your task is to analyze user voice/text transcripts in English, Tamil, Telugu, Kannada, or Malayalam "
        "and return a STRICT JSON object with structured incident fields.\n\n"
        "RULES:\n"
        "1. DROPFIX is NOT a laboratory test tool. NEVER state that contamination is scientifically proven. "
        "Use safe language: 'Suspected water-quality issue', 'Community report', 'Requires field verification'.\n"
        "2. Extract or infer: category, description (cleaned up in original language), translated_description_en, "
        "state (Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, Telangana, Puducherry), district, ward_locality, "
        "priority (Low, Medium, High, Critical), multiple_households (true/false), water_source_type, "
        "time_noticed, and cautious_safety_tip (practical home safety advice like boiling water or avoiding direct consumption).\n"
        "3. Output ONLY valid JSON matching this schema with no markdown ticks outside:\n"
        "{\n"
        '  "category": "Unusual Water Colour | Foul Smell | Bad Taste | Chemical Smell | Sewage Mixing | Pipeline Leakage | Wastewater Overflow | Dead Fish/Aquatic Life | Visible Particles/Sludge | Suspected Industrial Discharge | Health Concerns | Other",\n'
        '  "original_description": "...",\n'
        '  "translated_description_en": "...",\n'
        '  "state": "Tamil Nadu | Kerala | Karnataka | Andhra Pradesh | Telangana | Puducherry",\n'
        '  "district": "...",\n'
        '  "ward_locality": "...",\n'
        '  "priority": "Low | Medium | High | Critical",\n'
        '  "multiple_households": true,\n'
        '  "water_source_type": "Municipal Pipeline | Borewell / Ground | Overhead Tank | Lake / Waterbody | Public Tap | Tanker Water",\n'
        '  "time_noticed": "...",\n'
        '  "ai_preliminary_assessment": "Suspected water-quality report based on citizen description. Requires municipal field verification.",\n'
        '  "cautious_safety_tip": "Boil drinking water for at least 3-5 minutes. Avoid drinking discolored water until municipal verification."\n'
        "}"
    )

    user_query = f"Spoken Transcript ({language_code}): '{transcript}'. Selected state hint: {selected_state or 'South India'}."

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"dropfix-voice-{os.urandom(4).hex()}",
            system_message=system_prompt
        ).with_model("gemini", "gemini-3.5-flash")

        # Non-streaming call for structured JSON generation
        response_text = ""
        user_msg = UserMessage(text=user_query)
        # Using send_message for single structured JSON output
        response = await chat.send_message(user_msg)
        response_text = response.text if hasattr(response, "text") else str(response)

        # Clean JSON markdown if present
        clean_json = response_text.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json[7:]
        if clean_json.startswith("```"):
            clean_json = clean_json[3:]
        if clean_json.endswith("```"):
            clean_json = clean_json[:-3]
        clean_json = clean_json.strip()

        parsed = json.loads(clean_json)
        return parsed
    except Exception as e:
        logger.error(f"Gemini structuring failed: {e}. Falling back to rule-based parser.")
        return fallback_structuring(transcript, language_code, selected_state)

def fallback_structuring(transcript: str, language_code: str, selected_state: Optional[str]) -> Dict[str, Any]:
    text_lower = transcript.lower()
    
    category = "Unusual Water Colour"
    priority = "Medium"
    
    if any(w in text_lower for w in ["sewage", "drain", "gutter", "சாக்கடை", "మురుగు", "ಮಲ", "മലിനജലം"]):
        category = "Sewage Mixing"
        priority = "High"
    elif any(w in text_lower for w in ["smell", "odor", "stink", "நாற்றம்", "వాసన", "ವಾಸನೆ", "ദുർഗന്ധം"]):
        category = "Foul Smell"
        priority = "Medium"
    elif any(w in text_lower for w in ["leak", "burst", "pipe", "கசிவு", "పైపు", "ಸೋರಿಕೆ", "പൈപ്പ്"]):
        category = "Pipeline Leakage"
        priority = "Medium"
    elif any(w in text_lower for w in ["chemical", "factory", "இரசாயனம்", "రసాయన", "ರಾಸಾಯನಿಕ", "രാസവസ്തു"]):
        category = "Suspected Industrial Discharge"
        priority = "Critical"
    elif any(w in text_lower for w in ["stomach", "vomit", "fever", "illness", "வாந்தி", "వాంతులు", "ಜ್ವರ", "ഛർദ്ദി"]):
        category = "Health Concerns"
        priority = "High"
    elif any(w in text_lower for w in ["black", "yellow", "brown", "muddy", "மஞ்சள்", "నలుపు", "ಹಳದಿ", "മഞ്ഞ"]):
        category = "Unusual Water Colour"
        priority = "Medium"

    state = selected_state or "Tamil Nadu"
    
    return {
        "category": category,
        "original_description": transcript,
        "translated_description_en": f"[AI Assisted] Citizen reported: {transcript}",
        "state": state,
        "district": "Chennai" if state == "Tamil Nadu" else "Bengaluru Urban" if state == "Karnataka" else "Ernakulam" if state == "Kerala" else "Hyderabad" if state == "Telangana" else "Visakhapatnam" if state == "Andhra Pradesh" else "Puducherry",
        "ward_locality": "Reported Sector Ward",
        "priority": priority,
        "multiple_households": "many" in text_lower or "whole street" in text_lower or "all" in text_lower,
        "water_source_type": "Municipal Pipeline",
        "time_noticed": "Earlier today",
        "ai_preliminary_assessment": "Suspected water-quality report. Requires municipal field verification.",
        "cautious_safety_tip": "Boil drinking water for at least 3-5 minutes. Avoid direct ingestion until verified by municipal authorities."
    }

async def generate_officer_ai_summary(
    original_description: str,
    category: str,
    locality: str,
    district: str,
    state: str
) -> Dict[str, Any]:
    """
    Generates an executive AI summary and triage recommendation for municipal field officers.
    """
    EMERGENT_LLM_KEY = get_llm_key()
    if not EMERGENT_LLM_KEY:
        return {
            "summary_en": f"Citizen complaint regarding suspected {category} in {locality}, {district}, {state}.",
            "recommended_action": "Deploy field sampling technician to inspect supply line and test residual chlorine.",
            "field_urgency": "Standard Inspection (Within 12-24h)"
        }

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"dropfix-officer-{os.urandom(4).hex()}",
            system_message=(
                "You are the DROPFIX Municipal Operations AI Assistant. "
                "Provide a concise English summary, recommended field protocol, and triage urgency for municipal water engineers. "
                "Respond ONLY with valid JSON: {\"summary_en\": \"...\", \"recommended_action\": \"...\", \"field_urgency\": \"Immediate (2-4h) | Priority (6-12h) | Standard (24h)\"}"
            )
        ).with_model("gemini", "gemini-3.5-flash")

        user_prompt = f"Category: {category}\nLocality: {locality}, {district}, {state}\nCitizen Description: {original_description}"
        response = await chat.send_message(UserMessage(text=user_prompt))
        clean_text = response.text.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(clean_text)
    except Exception as e:
        logger.error(f"Officer AI summary generation failed: {e}")
        return {
            "summary_en": f"Citizen reported suspected {category} issue in {locality}, {district}.",
            "recommended_action": "Conduct site valve inspection and take standard water quality sample.",
            "field_urgency": "Standard (24h)"
        }
