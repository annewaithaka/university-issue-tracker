# 🎓 University Tracking Issue System (UTIS)

A simple university issue tracking system built with **Flask (Python)** for the backend and **React (Vite + Tailwind CSS)** for the frontend.

## 📁 Project Structure

university-issue-tracker/
│
├── backend/
│ ├── app.py # Flask main app (imports and registers blueprints)
│ ├── config.py # Configuration (DB, SECRET_KEY, etc.)
│ ├── models.py # SQLAlchemy models (User, Incharge, Issue, etc.)
│ ├── routes/ # Blueprint modules
│ │ ├── init.py # Initializes and registers blueprints
│ │ └── main_routes.py # Combined routes for users, incharges, and issues
│ ├── seed.py # Script for seeding initial data (e.g. admin/incharges)
│ ├── test_api.py # Pytest-based API tests
│ ├── requirements.txt # Python dependencies
│ ├── venv/ # Virtual environment (ignored by git)
│
│ Database file: backend/university_issues.db
│
└── frontend/
├── index.html
├── src/
│ ├── main.jsx
│ ├── App.jsx
│ ├── pages/
│ │ ├── Login.jsx
│ │ ├── Register.jsx
│ │ └── Dashboard.jsx
│ ├── components/
│ │ ├── Navbar.jsx
│ │ └── IssueCard.jsx
│ ├── api/
│ │ └── axiosConfig.js
│ └── assets/
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/annewaithaka/university-issue-tracker.git
cd university-issue-tracker

#cd backend
python -m venv venv
# Activate virtual environment
venv\Scripts\activate    # Windows
# OR
source venv/bin/activate # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Run the Flask app
python app.py

The backend should run on:
http://127.0.0.1:5000

###Setup the Database
If the database does not exist, Flask will create it automatically when you run app.py
To create a default admin manually:
python
Then paste:

from app import app, db
from models import User

with app.app_context():
    admin = User(
        name="Admin",
        email="admin@kca.ac.ke",
        role="admin",
        department="IT",
        year="N/A"
    )
    admin.set_password("admin123")
    db.session.add(admin)
    db.session.commit()

Exit Python with:

exit()


✅ Default Admin Credentials:

Email: admin@kca.ac.ke
Password: admin123

## Setup the Frontend
cd ../frontend
npm install
npm run dev

## 🧪 Running Tests

All backend tests are written using **pytest** to ensure API reliability.

To run the tests:

cd backend
pytest -v

## 👤 Default Test User

The test suite uses the following default user (created automatically during tests):

- **Name:** Carl James  
- **Email:** carl@gmail.com  
- **Password:** carl123  
- **Role:** user  
- **Department:** Electrical Engineering  
- **Year:** 2nd Year


## 🔐 Authentication

The system uses **Flask-Login** with session-based authentication (no JWTs).  
Each login creates a secure session stored in the browser, allowing users to access protected routes.  
You must be logged in to create, view, or modify issues.

Your frontend should now run on:

http://localhost:5173