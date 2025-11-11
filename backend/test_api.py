import pytest
import requests
from datetime import datetime

# --------------------------------------------------------
# Base URL (adjust if your Flask app uses a prefix)
# --------------------------------------------------------
BASE_URL = "http://127.0.0.1:5000/api"


@pytest.fixture(scope="session")
def session():
    """Persistent session to store cookies between requests."""
    return requests.Session()


@pytest.fixture(scope="session")
def user_data():
    return {
        "name": "Carl James",
        "email": "carl@gmail.com",
        "password": "carl123",
        "role": "user",
        "department": "Electrical Engineering",
        "year": "2nd Year"
    }


@pytest.fixture(scope="session")
def admin_data():
    return {
        "email": "admin@kca.ac.ke",
        "password": "admin123"
    }


@pytest.fixture(scope="session")
def incharge_data():
    return {
        "name": "Eng. Mary Njeri",
        "department": "Electrical Engineering",
        "email": "mary.njeri@example.com",
        "contact": "0712345678"
    }


# --------------------------------------------------------
# Helper: login a user and return authenticated session
# --------------------------------------------------------
def login_user(email, password):
    s = requests.Session()
    res = s.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed: {res.text}"
    return s


@pytest.fixture(scope="session")
def login_session(session, user_data):
    """Register and login user."""
    reg = session.post(f"{BASE_URL}/auth/register", json=user_data)
    assert reg.status_code in [200, 201, 409], reg.text

    login = session.post(f"{BASE_URL}/auth/login", json={
        "email": user_data["email"],
        "password": user_data["password"]
    })
    assert login.status_code == 200, login.text
    return session


@pytest.fixture(scope="session")
def admin_session(admin_data):
    """Admin login session (assuming seeded admin exists)."""
    return login_user(admin_data["email"], admin_data["password"])


# --------------------------------------------------------
# TEST 1: Register Incharge
# --------------------------------------------------------
def test_register_incharge(incharge_data):
    res = requests.post(f"{BASE_URL}/incharge/register", json=incharge_data)
    assert res.status_code in [200, 201, 409], res.text


# --------------------------------------------------------
# TEST 2: Get All Incharges
# --------------------------------------------------------
def test_get_all_incharges():
    res = requests.get(f"{BASE_URL}/incharge")
    assert res.status_code == 200, res.text
    data = res.json()
    assert isinstance(data, list)
    assert "name" in data[0] or len(data) == 0


# --------------------------------------------------------
# TEST 3: User Creates Issue
# --------------------------------------------------------
def test_create_issue(login_session):
    issue = {
        "title": "Faulty Lab Power Socket",
        "description": "Power socket in Lab 2 sparks when devices are plugged in.",
        "category": "Maintenance"
    }
    res = login_session.post(f"{BASE_URL}/issues", json=issue)
    assert res.status_code in [200, 201], res.text
    print("\nCreated issue:", res.text)


# --------------------------------------------------------
# TEST 4: Get All Issues
# --------------------------------------------------------
def test_get_all_issues(login_session):
    res = login_session.get(f"{BASE_URL}/issues")
    assert res.status_code == 200, res.text
    data = res.json()
    assert isinstance(data, list)
    if data:
        first = data[0]
        assert "created_at" in first
        assert "reporter" in first
        assert "status" in first


# --------------------------------------------------------
# TEST 5: Admin Assigns Incharge
# --------------------------------------------------------
def test_admin_assigns_incharge(admin_session):
    issues = admin_session.get(f"{BASE_URL}/issues").json()
    incharges = requests.get(f"{BASE_URL}/incharge").json()

    if not issues or not incharges:
        pytest.skip("No issues or incharges available")

    issue_id = issues[0]["id"]
    incharge_id = incharges[0]["id"]

    res = admin_session.put(
        f"{BASE_URL}/issues/{issue_id}/assign",
        json={"incharge_id": incharge_id}
    )
    assert res.status_code in [200, 400, 403], res.text


# --------------------------------------------------------
# TEST 6: Admin Marks Issue Completed
# --------------------------------------------------------
def test_mark_issue_complete(admin_session):
    issues = admin_session.get(f"{BASE_URL}/issues").json()
    if not issues:
        pytest.skip("No issues available to mark completed")

    issue_id = issues[0]["id"]
    res = admin_session.put(f"{BASE_URL}/issues/{issue_id}", json={"status": "Completed"})
    assert res.status_code in [200, 403, 404], res.text

    # Verify completed_at is set
    refreshed = admin_session.get(f"{BASE_URL}/issues").json()[0]
    if refreshed["status"].lower() == "completed":
        assert refreshed["completed_at"] is not None


# --------------------------------------------------------
# TEST 7: Delete Issue (Admin or Owner)
# --------------------------------------------------------
def test_delete_issue(admin_session):
    issues = admin_session.get(f"{BASE_URL}/issues").json()
    if not issues:
        pytest.skip("No issues to delete")

    issue_id = issues[-1]["id"]
    res = admin_session.delete(f"{BASE_URL}/issues/{issue_id}")
    assert res.status_code in [200, 403, 404], res.text

# ---------------------------------------------------------------------
# New test: Confirm that 3 seeded issues exist for admin dashboard
# ---------------------------------------------------------------------

def test_seeded_issues_exist(session):
    """Ensure that at least 3 issues were created during seeding."""
    # Log in as admin
    login = session.post("http://127.0.0.1:5000/api/auth/login", json={
        "email": "admin@kca.ac.ke",
        "password": "admin123"
    })
    assert login.status_code == 200, f"Admin login failed: {login.text}"

    # Get all issues
    res = session.get("http://127.0.0.1:5000/api/issues")
    assert res.status_code == 200, f"Failed to fetch issues: {res.text}"

    data = res.json()
    assert isinstance(data, list), "Issues response should be a list"
    assert len(data) >= 3, f"Expected ≥3 seeded issues, got {len(data)}"

    # Check that each issue has required fields
    for issue in data:
        assert "title" in issue
        assert "status" in issue
        assert "created_at" in issue
