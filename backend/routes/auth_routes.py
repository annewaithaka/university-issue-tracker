from flask import Blueprint, jsonify, request
from flask_login import login_user, logout_user, login_required, current_user
from models import db, User

# ✅ Define Blueprint
auth_bp = Blueprint("auth", __name__)

# -----------------------------------------------------------
# Register new user
# -----------------------------------------------------------
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    department = data.get("department")
    year = data.get("year")

    if not all([name, email, password]):
        return jsonify({"error": "Missing required fields"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    new_user = User(
        name=name,
        email=email,
        department=department,
        year=year
    )
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201

# -----------------------------------------------------------
# Login
# -----------------------------------------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    login_user(user)

    # ✅ Return full user data
    return jsonify({
        "message": f"Welcome {user.name}",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "department": user.department,
            "year": user.year
        }
    }), 200

# -----------------------------------------------------------
# Logout
# -----------------------------------------------------------
@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200

# -----------------------------------------------------------
# Get current logged-in user
# -----------------------------------------------------------
@auth_bp.route("/me", methods=["GET"])
@login_required
def get_current_user():
    return jsonify({
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "department": current_user.department,
        "year": current_user.year
    }), 200

# -----------------------------------------------------------
# Session check (for frontend auto-login)
# -----------------------------------------------------------
@auth_bp.route("/check", methods=["GET"])
def check_session():
    """Verify if a valid Flask-Login session exists."""
    if current_user.is_authenticated:
        return jsonify({
            "authenticated": True,
            "user": {
                "id": current_user.id,
                "name": current_user.name,
                "email": current_user.email,
                "role": current_user.role,
                "department": current_user.department,
                "year": current_user.year
            }
        }), 200
    return jsonify({"authenticated": False}), 200
