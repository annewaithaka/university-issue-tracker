# backend/routes/admin_routes.py
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from models import db, User, Issue

admin_bp = Blueprint("admin", __name__)

# -----------------------------------------------------------
# Helper: Check if current user is admin
# -----------------------------------------------------------
def admin_required():
    return current_user.is_authenticated and current_user.role == "admin"


# -----------------------------------------------------------
# GET all users (role="user")
# -----------------------------------------------------------
@admin_bp.route("/users", methods=["GET"])
@login_required
def get_users():
    if not admin_required():
        return jsonify({"error": "Unauthorized"}), 403

    users = User.query.filter_by(role="user").all()
    return jsonify([{
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "department": u.department,
        "year": u.year
    } for u in users]), 200

# -----------------------------------------------------------
# POST /admin/users — create new user
# -----------------------------------------------------------
@admin_bp.route("/users", methods=["POST"])
@login_required
def add_user():
    if not admin_required():
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    department = data.get("department")
    year = data.get("year")
    password = data.get("password", "default123")

    if not all([name, email, department, year]):
        return jsonify({"error": "Missing required fields"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 409

    new_user = User(
        name=name,
        email=email,
        department=department,
        year=year,
        role="user"
    )
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created successfully"}), 201


# -----------------------------------------------------------
# GET all incharges
# -----------------------------------------------------------
@admin_bp.route("/incharges", methods=["GET"])
@login_required
def get_incharges():
    if not admin_required():
        return jsonify({"error": "Unauthorized"}), 403

    incharges = User.query.filter_by(role="incharge").all()
    return jsonify([{
        "id": i.id,
        "name": i.name,
        "email": i.email,
        "department": i.department
    } for i in incharges]), 200


# -----------------------------------------------------------
# CREATE new incharge
# -----------------------------------------------------------
@admin_bp.route("/incharge", methods=["POST"])
@login_required
def add_incharge():
    if not admin_required():
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    department = data.get("department")
    password = data.get("password", "default123")

    if not all([name, email, department]):
        return jsonify({"error": "Missing fields"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 409

    new_incharge = User(
        name=name,
        email=email,
        department=department,
        role="incharge"
    )
    new_incharge.set_password(password)
    db.session.add(new_incharge)
    db.session.commit()
    return jsonify({"message": "Incharge added successfully"}), 201


# -----------------------------------------------------------
# GET all issues (Admin only)
# -----------------------------------------------------------
@admin_bp.route("/issues", methods=["GET"])
@login_required
def get_all_issues():
    if not admin_required():
        return jsonify({"error": "Unauthorized"}), 403

    issues = Issue.query.order_by(Issue.created_at.desc()).all()
    results = []
    for i in issues:
        reporter = i.reporter  # uses relationship
        incharge = i.incharge
        results.append({
            "id": i.id,
            "title": i.title,
            "description": i.description,
            "category": i.category,
            "status": i.status,
            "created_at": i.created_at.strftime("%Y-%m-%d %H:%M"),
            "reporter": reporter.name if reporter else "Unknown",
            "incharge": incharge.name if incharge else "Unassigned"
        })
    return jsonify(results), 200


# -----------------------------------------------------------
# ASSIGN incharge to issue (Admin only)
# -----------------------------------------------------------
@admin_bp.route("/assign/<int:issue_id>", methods=["PUT"])
@login_required
def assign_incharge(issue_id):
    if not admin_required():
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    incharge_id = data.get("incharge_id")
    issue = Issue.query.get(issue_id)
    if not issue:
        return jsonify({"error": "Issue not found"}), 404

    incharge = User.query.get(incharge_id)
    if not incharge or incharge.role != "incharge":
        return jsonify({"error": "Invalid incharge ID"}), 400

    issue.assigned_to_id = incharge.id
    issue.status = "Allocated"
    db.session.commit()
    return jsonify({"message": "Incharge assigned successfully"}), 200
