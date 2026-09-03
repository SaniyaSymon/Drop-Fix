"""DROPFIX Backend Regression Tests (iteration 2)."""
import os
import requests
import pytest

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---- Health ----
def test_health(api_client):
    r = api_client.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "healthy"
    assert d["region"] == "South India"
    assert set(d["supported_languages"]) == {"en", "ta", "te", "kn", "ml"}
    assert len(d["supported_states"]) == 6


# ---- Reports listing / filters / search ----
def test_reports_list(api_client):
    r = api_client.get(f"{BASE_URL}/api/reports?limit=100")
    assert r.status_code == 200
    assert len(r.json()) >= 6


def test_reports_filters(api_client):
    r = api_client.get(f"{BASE_URL}/api/reports?state=Tamil Nadu&public_only=true")
    assert r.status_code == 200
    for rep in r.json():
        assert rep["state"] == "Tamil Nadu"
        assert rep["is_public_visible"] is True

    r = api_client.get(f"{BASE_URL}/api/reports?category=Sewage Mixing")
    assert r.status_code == 200
    for rep in r.json():
        assert rep["category"] == "Sewage Mixing"

    r = api_client.get(f"{BASE_URL}/api/reports?search=Chennai")
    assert r.status_code == 200


def test_get_single_report(api_client):
    r = api_client.get(f"{BASE_URL}/api/reports/DF-2026-TN-4821")
    assert r.status_code == 200
    assert r.json()["report_id"] == "DF-2026-TN-4821"

    r2 = api_client.get(f"{BASE_URL}/api/reports/DF-2026-XX-0000")
    assert r2.status_code == 404


# ---- Tracking ----
def test_track_valid(api_client):
    r = api_client.post(f"{BASE_URL}/api/reports/track",
                        json={"report_id": "DF-2026-TN-4821", "tracking_code": "TRK-89324"})
    assert r.status_code == 200
    assert r.json()["report"]["status"] == "Field Investigation"


def test_track_invalid_code(api_client):
    r = api_client.post(f"{BASE_URL}/api/reports/track",
                        json={"report_id": "DF-2026-TN-4821", "tracking_code": "TRK-00000"})
    assert r.status_code == 400


def test_track_unknown_id(api_client):
    r = api_client.post(f"{BASE_URL}/api/reports/track",
                        json={"report_id": "DF-2026-ZZ-9999", "tracking_code": "TRK-00000"})
    assert r.status_code == 404


# ---- Bug fix verification: create report ----
def test_create_report_generates_codes(api_client):
    r = api_client.post(f"{BASE_URL}/api/reports", json={
        "original_description": "TEST_water is cloudy near TEST_market",
        "category": "Unusual Water Colour",
        "state": "Kerala", "district": "Ernakulam",
        "city_town": "Kochi", "ward_locality": "TEST_Ward"
    })
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["success"] is True
    rep = body["report"]
    assert rep["report_id"].startswith("DF-2026-KL-")
    assert rep["tracking_code"].startswith("TRK-") and len(rep["tracking_code"]) == 9
    assert len(rep["timeline"]) >= 2
    # persistence
    g = api_client.get(f"{BASE_URL}/api/reports/{rep['report_id']}")
    assert g.status_code == 200
    assert g.json()["report_id"] == rep["report_id"]
    pytest.created_report_id = rep["report_id"]


# ---- Bug fix verification: Gemini AI voice structuring (real translation) ----
def test_voice_structure_tamil_ai(api_client):
    r = api_client.post(f"{BASE_URL}/api/voice/structure", json={
        "transcript": "குடிநீரில் சாக்கடை நாற்றம் வருகிறது",
        "language_code": "ta", "selected_state": "Tamil Nadu"
    })
    assert r.status_code == 200
    d = r.json()["data"]
    # If this is real Gemini, translation should not start with the rule-based fallback prefix
    translated = (d.get("translated_description_en") or "").strip()
    assert translated, "No translated_description_en returned"
    fallback_prefix = "[AI Assisted] Citizen reported:"
    if translated.startswith(fallback_prefix):
        pytest.fail(f"Gemini fell back to rule-based parser. Translated: {translated!r}")
    assert d.get("category") in ("Sewage Mixing", "Bad Odour / Smell", "Suspected Industrial Discharge")


def test_voice_structure_empty(api_client):
    r = api_client.post(f"{BASE_URL}/api/voice/structure",
                        json={"transcript": "  ", "language_code": "en"})
    assert r.status_code == 400


# ---- Status update / moderation / officer AI ----
def test_status_update_and_moderate(api_client):
    rid = getattr(pytest, "created_report_id", None)
    if not rid:
        pytest.skip("no created report id")

    r = api_client.patch(f"{BASE_URL}/api/reports/{rid}/status", json={
        "status": "Field Investigation",
        "officer_notes": "TEST_officer inspecting",
        "assigned_officer_name": "TEST_Officer",
        "actor_name": "TEST_Officer",
        "actor_role": "Municipal Officer"
    })
    assert r.status_code == 200, r.text
    rep = r.json()["report"]
    assert rep["status"] == "Field Investigation"
    assert any(t["status"] == "Field Investigation" for t in rep["timeline"])

    m = api_client.patch(f"{BASE_URL}/api/reports/{rid}/moderate",
                         json={"is_public_visible": False, "actor_name": "TEST_Admin"})
    assert m.status_code == 200
    assert m.json()["is_public_visible"] is False


def test_officer_ai_summary(api_client):
    r = api_client.post(f"{BASE_URL}/api/reports/DF-2026-TN-4821/officer-ai-summary")
    assert r.status_code == 200
    brief = r.json().get("ai_brief")
    assert brief and isinstance(brief, (dict, str))


# ---- Advisories / clusters / analytics / audit / demo users ----
def test_advisories_flow(api_client):
    r = api_client.get(f"{BASE_URL}/api/advisories")
    assert r.status_code == 200
    assert isinstance(r.json(), list)

    c = api_client.post(f"{BASE_URL}/api/advisories", json={
        "title": "TEST_Boil Water Notice",
        "description": "TEST_precautionary advisory",
        "advisory_type": "Boil Water Notice",
        "severity": "High",
        "state": "Tamil Nadu",
        "district": "Chennai",
        "affected_areas": ["TEST_Area"],
        "action_instructions": ["Boil water"]
    })
    assert c.status_code == 200
    assert c.json()["advisory"]["advisory_id"].startswith("ADV-TN-")


def test_clusters(api_client):
    r = api_client.get(f"{BASE_URL}/api/clusters")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_analytics(api_client):
    r = api_client.get(f"{BASE_URL}/api/analytics")
    assert r.status_code == 200
    d = r.json()
    assert d["total_reports"] >= 6
    assert isinstance(d["state_breakdown"], dict)
    assert isinstance(d["category_breakdown"], list)


def test_audit_logs(api_client):
    r = api_client.get(f"{BASE_URL}/api/audit-logs?limit=20")
    assert r.status_code == 200
    logs = r.json()
    assert isinstance(logs, list) and len(logs) >= 1


def test_demo_users(api_client):
    r = api_client.get(f"{BASE_URL}/api/auth/demo-users")
    assert r.status_code == 200
    d = r.json()
    assert set(d.keys()) == {"citizen", "officer", "admin"}
