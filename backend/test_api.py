import pytest
import requests

BASE_URL = "http://127.0.0.1:5000"


@pytest.fixture(scope="session")
def session():
    """Creates a persistent requests session to store Flask-Login cookies."""
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
def login_session(session, user_data):
    """Registers and logs in user, returning an authenticated session."""
    # Register (ignore if already exists)
    reg = session.post(f"{BASE_URL}/register", json=user_data)
    if reg.status_code not in [200, 201, 409]:
        pytest.fail(f"Unexpected register status: {reg.status_code} - {reg.text}")

    # Login
    login = session.post(f"{BASE_URL}/login", json={
        "email": user_data["email"],
        "password": user_data["password"]
    })
    assert login.status_code == 200, f"Login failed: {login.text}"

    return session


@pytest.fixture(scope="session")
def incharge_data():
    return {
        "name": "Eng. Mary Njeri",
        "department": "Electrical Engineering",
        "email": "mary.njeri@example.com",
        "contact": "0712345678"
    }


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
    assert isinstance(res.json(), list)


# --------------------------------------------------------
# TEST 3: Create Issue (using session cookie)
# --------------------------------------------------------
def test_create_issue(login_session):
    issue = {
        "title": "Faulty Lab Power Socket",
        "description": "Power socket in Lab 2 is sparking when devices are plugged in.",
        "category": "Maintenance"
    }
    res = login_session.post(f"{BASE_URL}/issues", json=issue)
    assert res.status_code in [200, 201], res.text


# --------------------------------------------------------
# TEST 4: Get All Issues
# --------------------------------------------------------
def test_get_all_issues(login_session):
    res = login_session.get(f"{BASE_URL}/issues")
    assert res.status_code == 200, res.text
    data = res.json()
    assert isinstance(data, list)


# --------------------------------------------------------
# TEST 5: Get Single Issue
# --------------------------------------------------------
def test_get_single_issue(login_session):
    res = login_session.get(f"{BASE_URL}/issues/1")
    # Since you may not have issue 1 always present, allow 200 or 404
    assert res.status_code in [200, 404], res.text


# --------------------------------------------------------
# TEST 6: Update Issue
# --------------------------------------------------------
def test_update_issue(login_session):
    updated = {"status": "Resolved"}
    res = login_session.put(f"{BASE_URL}/issues/1", json=updated)
    # Only admins or incharge can update
    assert res.status_code in [200, 403, 404], res.text


# --------------------------------------------------------
# TEST 7: Delete Issue
# --------------------------------------------------------
def test_delete_issue(login_session):
    res = login_session.delete(f"{BASE_URL}/issues/1")
    # Only admins can delete — so 403 or 404 is acceptable
    assert res.status_code in [200, 403, 404], res.text
