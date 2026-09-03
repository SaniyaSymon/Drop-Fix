import os
import uuid
import random
import string
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from pathlib import Path

from fastapi import FastAPI, APIRouter, HTTPException, Query, Body, BackgroundTasks
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from models import Report, Advisory, IncidentCluster, AuditLog, TimelineEntry
from services.gemini_service import structure_voice_transcript, generate_officer_ai_summary
from seed_data import get_demo_reports, get_demo_advisories, get_demo_clusters

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("DROPFIX_SERVER")

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'dropfix_db')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

app = FastAPI(title="DROPFIX API - South India Water Quality Platform", version="1.0.0")
api_router = APIRouter(prefix="/api")

# State Code Map for IDs
STATE_CODES = {
    "Tamil Nadu": "TN",
    "Kerala": "KL",
    "Karnataka": "KA",
    "Andhra Pradesh": "AP",
    "Telangana": "TG",
    "Puducherry": "PY"
}

# State Center Defaults for Privacy Jitter
STATE_COORDINATES = {
    "Tamil Nadu": {"lat": 13.0827, "lng": 80.2707, "district": "Chennai"},
    "Kerala": {"lat": 9.9312, "lng": 76.2673, "district": "Ernakulam"},
    "Karnataka": {"lat": 12.9716, "lng": 77.5946, "district": "Bengaluru Urban"},
    "Andhra Pradesh": {"lat": 17.6868, "lng": 83.2185, "district": "Visakhapatnam"},
    "Telangana": {"lat": 17.3850, "lng": 78.4867, "district": "Hyderabad"},
    "Puducherry": {"lat": 11.9416, "lng": 79.8083, "district": "Puducherry"}
}

def generate_report_id(state_name: str) -> str:
    code = STATE_CODES.get(state_name, "SI")
    rand_num = random.randint(1000, 9999)
    return f"DF-2026-{code}-{rand_num}"

def generate_tracking_code() -> str:
    digits = ''.join(random.choices(string.digits, k=5))
    return f"TRK-{digits}"

# Startup Database Seeding
@app.on_event("startup")
async def startup_db_seed():
    try:
        count = await db.reports.count_documents({})
        if count == 0:
            logger.info("Initializing DROPFIX database with South India demo dataset...")
            demo_reports = get_demo_reports()
            await db.reports.insert_many(demo_reports)
            
            demo_advisories = get_demo_advisories()
            await db.advisories.insert_many(demo_advisories)
            
            demo_clusters = get_demo_clusters()
            await db.clusters.insert_many(demo_clusters)
            
            # Initial Audit Log
            await db.audit_logs.insert_one({
                "log_id": "AUD-INIT-001",
                "action": "SYSTEM_DATABASE_INITIALIZED",
                "actor_name": "DROPFIX System Seeder",
                "actor_role": "Super Admin",
                "details": {"message": "Pre-seeded South Indian demo incidents, advisories and clusters."},
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            logger.info("DROPFIX database successfully initialized with demo data.")
    except Exception as e:
        logger.error(f"Error during startup DB check: {e}")

# Pydantic Schemas for Requests
class ReportCreateRequest(BaseModel):
    is_anonymous: bool = True
    reporter_name: Optional[str] = "Anonymous Citizen"
    reporter_contact: Optional[str] = None
    report_language: str = "en"
    original_description: str
    original_voice_transcript: Optional[str] = None
    category: str
    priority: Optional[str] = "Medium"
    state: str = "Tamil Nadu"
    district: str = "Chennai"
    city_town: str = "Chennai"
    ward_locality: str = "Local Ward"
    landmark: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    approx_area_name: Optional[str] = None
    multiple_households_affected: bool = False
    affected_households_count_approx: Optional[str] = "1-5"
    water_source_type: Optional[str] = "Municipal Pipeline"
    time_noticed: Optional[str] = "Earlier today"
    photo_urls: List[str] = Field(default_factory=list)
    video_urls: List[str] = Field(default_factory=list)

class TrackReportRequest(BaseModel):
    report_id: str
    tracking_code: str

class UpdateReportStatusRequest(BaseModel):
    status: str
    officer_notes: Optional[str] = None
    assigned_officer_id: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    assigned_department: Optional[str] = None
    resolution_summary: Optional[str] = None
    resolution_photo_url: Optional[str] = None
    verification_label: Optional[str] = None
    actor_name: str = "Municipal Officer"
    actor_role: str = "Municipal Officer"

class VoiceStructureRequest(BaseModel):
    transcript: str
    language_code: str = "en"
    selected_state: Optional[str] = None

class AdvisoryCreateRequest(BaseModel):
    title: str
    description: str
    advisory_type: str = "Boil Water Notice"
    severity: str = "High"
    state: str
    district: str
    affected_areas: List[str] = Field(default_factory=list)
    action_instructions: List[str] = Field(default_factory=list)
    issued_by: str = "State Water Supply & Drainage Board"
    title_translations: Optional[Dict[str, str]] = None
    description_translations: Optional[Dict[str, str]] = None

# ----------------- ROUTES -----------------

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "DROPFIX API",
        "region": "South India",
        "tagline": "SPOT IT. REPORT IT. FIX IT.",
        "ai_engine": "Gemini 3.5 Flash",
        "supported_states": list(STATE_CODES.keys()),
        "supported_languages": ["en", "ta", "te", "kn", "ml"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# 1. Reports Endpoints
@api_router.get("/reports")
async def list_reports(
    state: Optional[str] = None,
    district: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    public_only: bool = False,
    search: Optional[str] = None,
    limit: int = Query(50, le=200)
):
    query: Dict[str, Any] = {}
    if state and state != "All States":
        query["state"] = state
    if district and district != "All Districts":
        query["district"] = district
    if category and category != "All Categories":
        query["category"] = category
    if priority and priority != "All Priorities":
        query["priority"] = priority
    if status and status != "All Statuses":
        query["status"] = status
    if public_only:
        query["is_public_visible"] = True
    if search:
        query["$or"] = [
            {"report_id": {"$regex": search, "$options": "i"}},
            {"original_description": {"$regex": search, "$options": "i"}},
            {"translated_description_en": {"$regex": search, "$options": "i"}},
            {"ward_locality": {"$regex": search, "$options": "i"}},
            {"district": {"$regex": search, "$options": "i"}},
            {"landmark": {"$regex": search, "$options": "i"}}
        ]

    docs = await db.reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs

@api_router.get("/reports/{report_id}")
async def get_report_by_id(report_id: str):
    doc = await db.reports.find_one({"report_id": report_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found.")
    return doc

@api_router.post("/reports")
async def create_report(req: ReportCreateRequest, background_tasks: BackgroundTasks):
    now = datetime.now(timezone.utc)
    report_id = generate_report_id(req.state)
    tracking_code = generate_tracking_code()
    
    # Calculate privacy-safe coordinate with subtle jitter (~300m)
    lat = req.latitude
    lng = req.longitude
    if not lat or not lng:
        default_coords = STATE_COORDINATES.get(req.state, STATE_COORDINATES["Tamil Nadu"])
        lat = default_coords["lat"] + random.uniform(-0.015, 0.015)
        lng = default_coords["lng"] + random.uniform(-0.015, 0.015)
    else:
        # Subtle privacy obfuscation: round to ~300m precision
        lat = round(lat + random.uniform(-0.002, 0.002), 4)
        lng = round(lng + random.uniform(-0.002, 0.002), 4)

    approx_area = req.approx_area_name or f"{req.ward_locality} (~400m area)"

    # AI Preliminary Evaluation
    ai_assessment = f"Suspected {req.category} reported by citizen in {req.ward_locality}, {req.district}. Requires municipal field verification."
    ai_advisory = "Suspected water-quality issue. Exercise caution. Boil water before drinking pending field inspection."
    translated_desc = None

    # Run AI Translation & Structuring if non-English or voice
    if req.report_language != "en" or req.original_voice_transcript:
        try:
            ai_data = await structure_voice_transcript(
                transcript=req.original_description,
                language_code=req.report_language,
                selected_state=req.state
            )
            translated_desc = ai_data.get("translated_description_en")
            ai_assessment = ai_data.get("ai_preliminary_assessment", ai_assessment)
            ai_advisory = ai_data.get("cautious_safety_tip", ai_advisory)
        except Exception as e:
            logger.error(f"Voice/AI enhancement error: {e}")

    # Map department by state
    dept_map = {
        "Tamil Nadu": "Chennai Metro Water / TWAD Board",
        "Karnataka": "BWSSB / KUWSDB",
        "Kerala": "Kerala Water Authority (KWA)",
        "Telangana": "HMWSSB / Mission Bhagiratha",
        "Andhra Pradesh": "GVMC / AP Urban Water Board",
        "Puducherry": "Puducherry PWD Water Division"
    }
    dept = dept_map.get(req.state, "Municipal Water Board")

    initial_timeline = [
        {
            "step_id": str(uuid.uuid4()),
            "status": "Submitted",
            "title": "Water Quality Issue Logged",
            "description": f"Incident reported ({req.report_language.upper()}) with {req.category} indicators.",
            "actor_name": req.reporter_name if not req.is_anonymous else "Anonymous Citizen",
            "actor_role": "Citizen",
            "timestamp": now.isoformat()
        },
        {
            "step_id": str(uuid.uuid4()),
            "status": "Under Review",
            "title": f"Triage Alert Routed to {dept}",
            "description": "AI safety assessment attached. Incident pending officer assignment.",
            "actor_name": "DROPFIX AI Core",
            "actor_role": "AI System",
            "timestamp": (now + timedelta(seconds=2)).isoformat()
        }
    ]

    report_dict = {
        "report_id": report_id,
        "tracking_code": tracking_code,
        "is_anonymous": req.is_anonymous,
        "reporter_name": req.reporter_name if not req.is_anonymous else "Anonymous Citizen",
        "reporter_contact": req.reporter_contact if not req.is_anonymous else None,
        "report_language": req.report_language,
        "original_description": req.original_description,
        "original_voice_transcript": req.original_voice_transcript,
        "translated_description_en": translated_desc,
        "translation_status": "completed",
        "category": req.category,
        "priority": req.priority or "Medium",
        "status": "Submitted",
        "verification_label": "Citizen Report",
        "state": req.state,
        "district": req.district,
        "city_town": req.city_town,
        "ward_locality": req.ward_locality,
        "landmark": req.landmark,
        "pincode": req.pincode,
        "latitude": lat,
        "longitude": lng,
        "approx_area_name": approx_area,
        "is_public_visible": True,
        "multiple_households_affected": req.multiple_households_affected,
        "affected_households_count_approx": req.affected_households_count_approx,
        "water_source_type": req.water_source_type,
        "time_noticed": req.time_noticed,
        "photo_urls": req.photo_urls,
        "video_urls": req.video_urls,
        "ai_preliminary_assessment": ai_assessment,
        "ai_cautious_advisory": ai_advisory,
        "ai_suggested_priority": req.priority or "Medium",
        "assigned_department": dept,
        "assigned_officer_id": None,
        "assigned_officer_name": None,
        "officer_notes": None,
        "resolution_summary": None,
        "resolution_photo_url": None,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "timeline": initial_timeline,
        "is_demo_seed": False
    }

    await db.reports.insert_one(report_dict)

    # Insert Audit Log
    await db.audit_logs.insert_one({
        "log_id": f"AUD-{str(uuid.uuid4())[:8].upper()}",
        "action": "REPORT_CREATED",
        "actor_name": req.reporter_name if not req.is_anonymous else "Anonymous Citizen",
        "actor_role": "Citizen",
        "target_report_id": report_id,
        "details": {"category": req.category, "state": req.state, "district": req.district},
        "timestamp": now.isoformat()
    })

    # Return clean dict without MongoDB _id
    report_dict.pop("_id", None)
    return {
        "success": True,
        "message": "Report submitted successfully.",
        "report": report_dict
    }

# 2. Tracking Endpoint
@api_router.post("/reports/track")
async def track_report(req: TrackReportRequest):
    clean_id = req.report_id.strip().upper()
    clean_code = req.tracking_code.strip().upper()

    doc = await db.reports.find_one(
        {"report_id": clean_id, "tracking_code": clean_code},
        {"_id": 0}
    )
    if not doc:
        # Fallback: Check if report_id matches alone for easy demo tracking
        doc_by_id = await db.reports.find_one({"report_id": clean_id}, {"_id": 0})
        if doc_by_id:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid tracking code for {clean_id}. Please check your confirmation SMS or receipt."
            )
        raise HTTPException(
            status_code=404,
            detail=f"No report found matching ID '{clean_id}' and tracking code."
        )
    return {
        "success": True,
        "report": doc
    }

# 3. Status Update & Officer Operations
@api_router.patch("/reports/{report_id}/status")
async def update_report_status(report_id: str, req: UpdateReportStatusRequest):
    now = datetime.now(timezone.utc)
    doc = await db.reports.find_one({"report_id": report_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found.")

    update_fields: Dict[str, Any] = {
        "status": req.status,
        "updated_at": now.isoformat()
    }

    if req.officer_notes:
        update_fields["officer_notes"] = req.officer_notes
    if req.assigned_officer_name:
        update_fields["assigned_officer_name"] = req.assigned_officer_name
    if req.assigned_officer_id:
        update_fields["assigned_officer_id"] = req.assigned_officer_id
    if req.assigned_department:
        update_fields["assigned_department"] = req.assigned_department
    if req.resolution_summary:
        update_fields["resolution_summary"] = req.resolution_summary
    if req.resolution_photo_url:
        update_fields["resolution_photo_url"] = req.resolution_photo_url

    # Update verification label appropriately
    if req.status == "Resolved":
        update_fields["verification_label"] = "Resolved"
    elif req.status in ["Field Investigation", "Action in Progress"]:
        update_fields["verification_label"] = "Field Verified"
    elif req.verification_label:
        update_fields["verification_label"] = req.verification_label

    # Build timeline step
    step_title = {
        "Under Review": "Under Authority Review",
        "Officer Assigned": f"Assigned to {req.assigned_officer_name or 'Field Engineer'}",
        "Field Investigation": "Field Inspection & Water Sampling",
        "Action in Progress": "Municipal Action / Pipeline Repair in Progress",
        "Resolved": "Issue Resolved & Water Quality Restored",
        "Closed": "Case Closed"
    }.get(req.status, f"Status changed to {req.status}")

    new_timeline_entry = {
        "step_id": str(uuid.uuid4()),
        "status": req.status,
        "title": step_title,
        "description": req.officer_notes or req.resolution_summary or f"Officer updated status to {req.status}",
        "actor_name": req.actor_name,
        "actor_role": req.actor_role,
        "timestamp": now.isoformat(),
        "evidence_photo_url": req.resolution_photo_url,
        "action_taken": req.resolution_summary
    }

    await db.reports.update_one(
        {"report_id": report_id},
        {
            "$set": update_fields,
            "$push": {"timeline": new_timeline_entry}
        }
    )

    # Insert Audit Log
    await db.audit_logs.insert_one({
        "log_id": f"AUD-{str(uuid.uuid4())[:8].upper()}",
        "action": f"STATUS_UPDATE_{req.status.upper()}",
        "actor_name": req.actor_name,
        "actor_role": req.actor_role,
        "target_report_id": report_id,
        "details": {"new_status": req.status, "notes": req.officer_notes},
        "timestamp": now.isoformat()
    })

    updated_doc = await db.reports.find_one({"report_id": report_id}, {"_id": 0})
    return {
        "success": True,
        "message": f"Report {report_id} updated to {req.status}.",
        "report": updated_doc
    }

# 4. Moderation & Public Visibility
@api_router.patch("/reports/{report_id}/moderate")
async def toggle_public_visibility(
    report_id: str,
    is_public_visible: bool = Body(..., embed=True),
    actor_name: str = Body("Admin", embed=True)
):
    result = await db.reports.update_one(
        {"report_id": report_id},
        {"$set": {"is_public_visible": is_public_visible, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    
    await db.audit_logs.insert_one({
        "log_id": f"AUD-{str(uuid.uuid4())[:8].upper()}",
        "action": "PUBLIC_VISIBILITY_TOGGLED",
        "actor_name": actor_name,
        "actor_role": "Super Admin",
        "target_report_id": report_id,
        "details": {"is_public_visible": is_public_visible},
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    return {"success": True, "report_id": report_id, "is_public_visible": is_public_visible}

# 5. Voice & AI Structuring
@api_router.post("/voice/structure")
async def structure_voice(req: VoiceStructureRequest):
    if not req.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty.")
    
    structured = await structure_voice_transcript(
        transcript=req.transcript,
        language_code=req.language_code,
        selected_state=req.selected_state
    )
    return {
        "success": True,
        "data": structured
    }

@api_router.post("/reports/{report_id}/officer-ai-summary")
async def get_officer_ai_brief(report_id: str):
    doc = await db.reports.find_one({"report_id": report_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")
    
    summary = await generate_officer_ai_summary(
        original_description=doc.get("original_description", ""),
        category=doc.get("category", "General"),
        locality=doc.get("ward_locality", "Locality"),
        district=doc.get("district", "District"),
        state=doc.get("state", "Tamil Nadu")
    )
    return {
        "success": True,
        "report_id": report_id,
        "ai_brief": summary
    }

# 6. Advisories & Emergency Bulletins
@api_router.get("/advisories")
async def list_advisories(state: Optional[str] = None):
    query: Dict[str, Any] = {"is_active": True}
    if state and state != "All States":
        query["state"] = state
    advisories = await db.advisories.find(query, {"_id": 0}).sort("created_at", -1).to_list(20)
    return advisories

@api_router.post("/advisories")
async def create_advisory(req: AdvisoryCreateRequest):
    now = datetime.now(timezone.utc)
    advisory_id = f"ADV-{STATE_CODES.get(req.state, 'SI')}-{str(uuid.uuid4())[:6].upper()}"
    
    adv_dict = {
        "advisory_id": advisory_id,
        "title": req.title,
        "title_translations": req.title_translations or {"en": req.title},
        "description": req.description,
        "description_translations": req.description_translations or {"en": req.description},
        "advisory_type": req.advisory_type,
        "severity": req.severity,
        "state": req.state,
        "district": req.district,
        "affected_areas": req.affected_areas,
        "action_instructions": req.action_instructions,
        "issued_by": req.issued_by,
        "is_active": True,
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(days=3)).isoformat(),
        "is_demo_seed": False
    }

    await db.advisories.insert_one(adv_dict)
    adv_dict.pop("_id", None)
    return {"success": True, "advisory": adv_dict}

# 7. Hotspot Incident Clusters
@api_router.get("/clusters")
async def list_incident_clusters(state: Optional[str] = None):
    query: Dict[str, Any] = {}
    if state and state != "All States":
        query["state"] = state
    clusters = await db.clusters.find(query, {"_id": 0}).to_list(50)
    return clusters

# 8. South India Analytics & Telemetry
@api_router.get("/analytics")
async def get_analytics(state: Optional[str] = None):
    match_query: Dict[str, Any] = {}
    if state and state != "All States":
        match_query["state"] = state

    total_reports = await db.reports.count_documents(match_query)
    resolved_reports = await db.reports.count_documents({**match_query, "status": "Resolved"})
    in_progress = await db.reports.count_documents({**match_query, "status": {"$in": ["Officer Assigned", "Field Investigation", "Action in Progress"]}})
    critical_reports = await db.reports.count_documents({**match_query, "priority": "Critical"})
    active_advisories = await db.advisories.count_documents({"is_active": True, **match_query})

    # State counts
    state_pipeline = [
        {"$group": {"_id": "$state", "count": {"$sum": 1}}}
    ]
    state_counts_cursor = db.reports.aggregate(state_pipeline)
    state_breakdown = {doc["_id"]: doc["count"] async for doc in state_counts_cursor if doc.get("_id")}

    # Category counts
    cat_pipeline = [
        {"$match": match_query},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    cat_counts_cursor = db.reports.aggregate(cat_pipeline)
    category_breakdown = [{ "category": doc["_id"], "count": doc["count"] } async for doc in cat_counts_cursor if doc.get("_id")]

    # Resolution Rate
    resolution_rate = round((resolved_reports / total_reports * 100), 1) if total_reports > 0 else 0.0

    return {
        "total_reports": total_reports,
        "resolved_reports": resolved_reports,
        "in_progress": in_progress,
        "critical_reports": critical_reports,
        "active_advisories": active_advisories,
        "resolution_rate_percent": resolution_rate,
        "state_breakdown": state_breakdown,
        "category_breakdown": category_breakdown,
        "average_triage_time_hours": 3.8
    }

# 9. Audit Logs
@api_router.get("/audit-logs")
async def get_audit_logs(limit: int = 50):
    logs = await db.audit_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return logs

# 10. Demo Auth Profiles
@api_router.get("/auth/demo-users")
async def get_demo_users():
    return {
        "citizen": {
            "name": "Ananya / Anonymous Citizen",
            "email": "citizen@dropfix.in",
            "role": "Citizen",
            "jurisdiction": "South India",
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
        },
        "officer": {
            "name": "Er. S. Ramanathan",
            "email": "officer.tamilnadu@dropfix.in",
            "role": "Municipal Officer",
            "department": "Chennai Metro Water (CMWSSB)",
            "jurisdiction": "Zone 10 - Central Chennai",
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
        },
        "admin": {
            "name": "Dr. A. V. Narayanan",
            "email": "admin.south@dropfix.in",
            "role": "Super Admin",
            "department": "South India Joint Water Safety Taskforce",
            "jurisdiction": "Tamil Nadu, Kerala, Karnataka, AP, Telangana, Puducherry",
            "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"
        }
    }

# 11. Reset / Seed Endpoint
@api_router.post("/seed")
async def reset_and_seed_data():
    await db.reports.delete_many({})
    await db.advisories.delete_many({})
    await db.clusters.delete_many({})
    await db.audit_logs.delete_many({})

    await db.reports.insert_many(get_demo_reports())
    await db.advisories.insert_many(get_demo_advisories())
    await db.clusters.insert_many(get_demo_clusters())

    await db.audit_logs.insert_one({
        "log_id": "AUD-RESEED-001",
        "action": "DATABASE_RESEEDED",
        "actor_name": "Demo Controller",
        "actor_role": "Super Admin",
        "details": {"message": "Reset and restored full South Indian test dataset."},
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return {"success": True, "message": "Database reseeded successfully with South India demo records."}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
