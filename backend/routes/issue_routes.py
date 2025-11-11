# backend/routes/issue_routes.py
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from datetime import datetime
from models import db, Issue, User

issue_bp = Blueprint("issues", __name__)

# -----------------------------------------------------------
# CREATE ISSUE (User, Incharge, or Admin)
# -----------------------------------------------------------
@issue_bp.route("/", methods=["POST"])
@login_required
def create_issue():
    if current_user.role not in ["user", "incharge", "admin"]:
        return jsonify({"error": "Unauthorized role"}), 403

    data = request.get_json() or {}
    title = data.get("title")
    description = data.get("description")
    category = data.get("category")

    if not all([title, description, category]):
        return jsonify({"error": "Missing required fields"}), 400

    issue = Issue(
        title=title.strip(),
        description=description.strip(),
        category=category.strip(),
        status="Pending",
        reported_by_id=current_user.id,
        created_at=datetime.utcnow()
    )
    db.session.add(issue)
    db.session.commit()

    return jsonify({"message": "Issue created successfully!"}), 201


# -----------------------------------------------------------
# GET ISSUES BASED ON ROLE
# -----------------------------------------------------------
@issue_bp.route("/", methods=["GET"])
@login_required
def get_issues():
    if current_user.role == "admin":
        issues = Issue.query.order_by(Issue.created_at.desc()).all()
    elif current_user.role == "incharge":
        issues = Issue.query.filter_by(assigned_to_id=current_user.id).order_by(Issue.created_at.desc()).all()
    else:  # user
        issues = Issue.query.filter_by(reported_by_id=current_user.id).order_by(Issue.created_at.desc()).all()

    results = []
    for i in issues:
        results.append({
            "id": i.id,
            "title": i.title,
            "description": i.description,
            "status": i.status,
            "category": i.category,
            "created_at": i.created_at.strftime("%Y-%m-%d %H:%M"),
            "completed_at": i.completed_at.strftime("%Y-%m-%d %H:%M") if i.completed_at else None,
            "reporter": {
                "id": i.reporter.id,
                "name": i.reporter.name,
                "email": i.reporter.email
            } if i.reporter else None,
            "incharge": {
                "id": i.incharge.id,
                "name": i.incharge.name,
                "email": i.incharge.email
            } if i.incharge else None
        })

    return jsonify(results), 200


# -----------------------------------------------------------
# UPDATE ISSUE STATUS (Admin or Incharge)
# -----------------------------------------------------------
@issue_bp.route("/<int:issue_id>", methods=["PUT"])
@login_required
def update_issue(issue_id):
    issue = Issue.query.get(issue_id)
    if not issue:
        return jsonify({"error": "Issue not found"}), 404

    if current_user.role not in ["admin", "incharge"]:
        return jsonify({"error": "Permission denied"}), 403

    data = request.get_json() or {}
    new_status = data.get("status")
    if not new_status:
        return jsonify({"error": "Missing status"}), 400

    issue.status = new_status.strip().capitalize()
    issue.completed_at = datetime.utcnow() if issue.status.lower() == "completed" else None
    db.session.commit()

    return jsonify({"message": "Issue status updated successfully"}), 200


# -----------------------------------------------------------
# DELETE ISSUE (Admin or Owner)
# -----------------------------------------------------------
@issue_bp.route("/<int:issue_id>", methods=["DELETE"])
@login_required
def delete_issue(issue_id):
    issue = Issue.query.get(issue_id)
    if not issue:
        return jsonify({"error": "Issue not found"}), 404

    if current_user.role != "admin" and current_user.id != issue.reported_by_id:
        return jsonify({"error": "Permission denied"}), 403

    db.session.delete(issue)
    db.session.commit()
    return jsonify({"message": "Issue deleted successfully"}), 200


# -----------------------------------------------------------
# ASSIGN INCHARGE TO ISSUE (Admin only)
# -----------------------------------------------------------
@issue_bp.route("/<int:issue_id>/assign", methods=["PUT"])
@login_required
def assign_incharge(issue_id):
    if current_user.role != "admin":
        return jsonify({"error": "Permission denied"}), 403

    data = request.get_json() or {}
    incharge_id = data.get("incharge_id")
    if not incharge_id:
        return jsonify({"error": "Missing incharge_id"}), 400

    issue = Issue.query.get(issue_id)
    if not issue:
        return jsonify({"error": "Issue not found"}), 404

    incharge = User.query.get(incharge_id)
    if not incharge or incharge.role != "incharge":
        return jsonify({"error": "Invalid incharge"}), 400

    issue.assigned_to_id = incharge.id
    issue.status = "Assigned"
    db.session.commit()

    return jsonify({"message": f"Issue assigned to {incharge.name}"}), 200


# -----------------------------------------------------------
# GET ISSUES FOR CURRENT LOGGED-IN USER
# -----------------------------------------------------------
@issue_bp.route("/user/issues", methods=["GET"])
@login_required
def get_user_issues():
    issues = Issue.query.filter_by(reported_by_id=current_user.id).order_by(Issue.created_at.desc()).all()
    return jsonify([{
        "id": i.id,
        "title": i.title,
        "description": i.description,
        "status": i.status,
        "category": i.category,
        "created_at": i.created_at.strftime("%Y-%m-%d %H:%M")
    } for i in issues]), 200
