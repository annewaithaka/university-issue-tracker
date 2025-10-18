# backend/routes/issue_routes.py
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from models import db, Issue, User

issue_bp = Blueprint("issues", __name__)

@issue_bp.route("/", methods=["POST"])
@login_required
def create_issue():
    data = request.get_json()
    title = data.get("title")
    description = data.get("description")
    category = data.get("category")

    if not all([title, description, category]):
        return jsonify({"error": "Missing fields"}), 400

    issue = Issue(title=title, description=description, category=category, user_id=current_user.id)
    db.session.add(issue)
    db.session.commit()
    return jsonify({"message": "Issue submitted successfully!"}), 201


@issue_bp.route("/", methods=["GET"])
@login_required
def get_issues():
    # Admin sees all issues; users see only their own
    if current_user.role == "admin":
        issues = Issue.query.order_by(Issue.created_at.desc()).all()
    else:
        issues = Issue.query.filter_by(user_id=current_user.id).order_by(Issue.created_at.desc()).all()

    results = []
    for i in issues:
        # reporter info (for admin it will be useful; for users it's the same user)
        reporter = User.query.get(i.user_id)
        results.append({
            "id": i.id,
            "title": i.title,
            "description": i.description,
            "category": i.category,
            "status": i.status,
            # created_at already formatted as string in previous code; format here
            "created_at": i.created_at.strftime("%Y-%m-%d %H:%M"),
            "user": {
                "id": reporter.id,
                "name": reporter.name,
                "email": reporter.email
            } if reporter else None
        })

    return jsonify(results), 200


@issue_bp.route("/<int:issue_id>", methods=["GET"])
@login_required
def get_issue(issue_id):
    issue = Issue.query.get(issue_id)
    if not issue:
        return jsonify({"error": "Issue not found"}), 404
    reporter = User.query.get(issue.user_id)
    return jsonify({
        "id": issue.id,
        "title": issue.title,
        "description": issue.description,
        "category": issue.category,
        "status": issue.status,
        "created_at": issue.created_at.strftime("%Y-%m-%d %H:%M"),
        "user": {
            "id": reporter.id,
            "name": reporter.name,
            "email": reporter.email
        } if reporter else None
    }), 200


@issue_bp.route("/<int:issue_id>", methods=["PUT"])
@login_required
def update_issue(issue_id):
    issue = Issue.query.get(issue_id)
    if not issue:
        return jsonify({"error": "Issue not found"}), 404

    # Only admin or incharge can update issues
    if current_user.role not in ["admin", "incharge"]:
        return jsonify({"error": "Permission denied"}), 403

    data = request.get_json()
    issue.status = data.get("status", issue.status)
    db.session.commit()

    return jsonify({"message": "Issue updated successfully"}), 200


@issue_bp.route("/<int:issue_id>", methods=["DELETE"])
@login_required
def delete_issue(issue_id):
    issue = Issue.query.get(issue_id)
    if not issue:
        return jsonify({"error": "Issue not found"}), 404

    # Only admin can delete
    if current_user.role != "admin":
        return jsonify({"error": "Permission denied"}), 403

    db.session.delete(issue)
    db.session.commit()
    return jsonify({"message": "Issue deleted successfully"}), 200
