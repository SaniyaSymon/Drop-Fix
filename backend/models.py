from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional, List, Dict, Any, Annotated
from datetime import datetime, timezone
from bson import ObjectId
import uuid

def validate_object_id(v: Any) -> str:
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str) and ObjectId.is_valid(v):
        return v
    raise ValueError("Invalid ObjectId")

PyObjectId = Annotated[str, BeforeValidator(validate_object_id)]

class BaseDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

    def to_mongo(self) -> Dict[str, Any]:
        data = self.model_dump(by_alias=True, exclude_none=True)
        if "_id" in data and data["_id"] is not None:
            data["_id"] = ObjectId(data["_id"])
        elif "_id" in data:
            del data["_id"]
        return data

    @classmethod
    def from_mongo(cls, data: Dict[str, Any]):
        if not data:
            return None
        if "_id" in data:
            data["_id"] = str(data["_id"])
        return cls(**data)

class TimelineEntry(BaseModel):
    step_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str
    title: str
    description: str
    actor_name: str
    actor_role: str # "Citizen", "AI System", "Municipal Officer", "Lab Analyst", "Super Admin"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    evidence_photo_url: Optional[str] = None
    action_taken: Optional[str] = None

class Report(BaseDocument):
    report_id: str # e.g. DF-2026-TN-4821
    tracking_code: str # e.g. TRK-89324
    is_anonymous: bool = True
    reporter_name: Optional[str] = "Anonymous Citizen"
    reporter_contact: Optional[str] = None
    
    # Multilingual tracking
    report_language: str = "en" # "en", "ta", "te", "kn", "ml"
    original_description: str
    original_voice_transcript: Optional[str] = None
    translated_description_en: Optional[str] = None
    translated_voice_transcript_en: Optional[str] = None
    translation_status: Optional[str] = "completed"
    
    # Issue Classification
    category: str # "Unusual Water Colour", "Foul Smell", "Bad Taste", "Chemical Smell", "Sewage Mixing", "Pipeline Leakage", "Wastewater Overflow", "Dead Fish/Aquatic Life", "Visible Particles/Sludge", "Suspected Industrial Discharge", "Health Concerns", "Other"
    priority: str = "Medium" # "Low", "Medium", "High", "Critical"
    status: str = "Submitted" # "Submitted", "Under Review", "Officer Assigned", "Field Investigation", "Action in Progress", "Resolved", "Closed"
    verification_label: str = "Citizen Report" # "Citizen Report", "Under Review", "Verified Authority Advisory", "Field Verified", "Resolved"
    
    # South India Geography
    state: str # "Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana", "Puducherry"
    district: str
    city_town: str
    ward_locality: str
    landmark: Optional[str] = None
    pincode: Optional[str] = None
    
    # Privacy safe approximate coordinates (within ~500m area)
    latitude: float
    longitude: float
    approx_area_name: str
    is_public_visible: bool = True
    
    # Indicators
    multiple_households_affected: bool = False
    affected_households_count_approx: Optional[str] = "1-5"
    water_source_type: Optional[str] = "Municipal Pipeline" # "Municipal Pipeline", "Borewell / Ground", "Overhead Tank", "Lake / Waterbody", "Public Tap", "Tanker Water"
    time_noticed: Optional[str] = "Within last 24 hours"
    
    # Evidence
    photo_urls: List[str] = Field(default_factory=list)
    video_urls: List[str] = Field(default_factory=list)
    
    # AI Assistance
    ai_preliminary_assessment: Optional[str] = None
    ai_cautious_advisory: Optional[str] = "Suspected water-quality issue. Requires field verification before action."
    ai_suggested_priority: Optional[str] = None
    
    # Officer and Municipal Assignment
    assigned_department: Optional[str] = None # e.g. "Chennai Metro Water", "BWSSB", "KWA", "HMWSSB", "GVMC"
    assigned_officer_id: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    officer_notes: Optional[str] = None
    resolution_summary: Optional[str] = None
    resolution_photo_url: Optional[str] = None
    
    # Timestamps & Timeline
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    timeline: List[TimelineEntry] = Field(default_factory=list)
    
    # Seed tag
    is_demo_seed: bool = False

class Advisory(BaseDocument):
    advisory_id: str = Field(default_factory=lambda: f"ADV-{str(uuid.uuid4())[:8].upper()}")
    title: str
    title_translations: Dict[str, str] = Field(default_factory=dict)
    description: str
    description_translations: Dict[str, str] = Field(default_factory=dict)
    advisory_type: str = "Boil Water Notice" # "Boil Water Notice", "Pipeline Maintenance", "Turbidity Alert", "Sewage Precaution", "Supply Restored"
    severity: str = "High" # "Low", "Medium", "High", "Critical"
    state: str
    district: str
    affected_areas: List[str] = Field(default_factory=list)
    action_instructions: List[str] = Field(default_factory=list)
    issued_by: str = "State Water Supply & Drainage Board"
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    expires_at: Optional[str] = None
    is_demo_seed: bool = False

class IncidentCluster(BaseDocument):
    cluster_id: str = Field(default_factory=lambda: f"CLU-{str(uuid.uuid4())[:8].upper()}")
    cluster_name: str
    state: str
    district: str
    locality: str
    incident_count: int
    common_category: str
    severity_level: str
    first_reported_at: str
    last_reported_at: str
    center_lat: float
    center_lng: float
    status: str = "Active Investigation" # "Active Investigation", "Escalated", "Contained", "Resolved"
    recommended_municipal_action: str

class AuditLog(BaseDocument):
    log_id: str = Field(default_factory=lambda: f"AUD-{str(uuid.uuid4())[:8].upper()}")
    action: str
    actor_name: str
    actor_role: str
    target_report_id: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
