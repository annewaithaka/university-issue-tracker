# backend/routes/issue_routes.py
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from datetime import datetime
from models import db, Issue, User, Comment

issue_bp = Blueprint("issues", __name__)

# -----------------------------------------------------------
# CREATE ISSUE (Users only)
# -----------------------------------------------------------
@issue_bp.route("/", methods=["POST"])
@login_required
def create_issue():
    if current_user.role != "user":
        return jsonify({"error": "Only users can submit issues"}), 403

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
        reporter_id=current_user.id,
        created_at=datetime.utcnow()
    )
    db.session.add(issue)
    db.session.commit()

    return jsonify({"message": "Issue created successfully!", "issue_id": issue.id}), 201

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
        issues = Issue.query.filter_by(reporter_id=current_user.id).order_by(Issue.created_at.desc()).all()

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
            } if i.reporter else {"name": "Unknown"},
            "incharge": {
                "id": i.assigned_to.id,
                "name": i.assigned_to.name,
                "email": i.assigned_to.email
            } if i.assigned_to else None
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

    data = request.get_json() or {}

    # If admin/incharge updates status
    if current_user.role in ["admin", "incharge"]:
        new_status = data.get("status")
        if new_status:
            issue.status = new_status.strip().capitalize()
            issue.completed_at = datetime.utcnow() if issue.status.lower() == "completed" else None
            db.session.commit()
            return jsonify({"message": "Issue status updated successfully"}), 200

    # If user updates their own issue (title/description/category)
    if current_user.role == "user" and issue.reporter_id == current_user.id:
        title = data.get("title")
        description = data.get("description")
        category = data.get("category")

        if not any([title, description, category]):
            return jsonify({"error": "Nothing to update"}), 400

        if title:
            issue.title = title.strip()
        if description:
            issue.description = description.strip()
        if category:
            issue.category = category.strip()

        db.session.commit()
        return jsonify({"message": "Issue updated successfully"}), 200

    return jsonify({"error": "Permission denied"}), 403

# -----------------------------------------------------------
# DELETE ISSUE (Admin or Owner)
# -----------------------------------------------------------
@issue_bp.route("/<int:issue_id>", methods=["DELETE"])
@login_required
def delete_issue(issue_id):
    issue = Issue.query.get(issue_id)
    if not issue:
        return jsonify({"error": "Issue not found"}), 404

    # USER DELETE: Only delete their own issue
    if current_user.role == "user":
        if issue.reporter_id != current_user.id:
            return jsonify({"error": "Permission denied"}), 403
        db.session.delete(issue)
        db.session.commit()
        return jsonify({"message": "Issue deleted successfully"}), 200

    # ADMIN DELETE: Only allowed if status is Completed
    if current_user.role == "admin":
        if issue.status.lower() != "completed":
            return jsonify({
                "error": "Admin can only delete issues that are completed"
            }), 403

        db.session.delete(issue)
        db.session.commit()
        return jsonify({"message": "Issue deleted successfully"}), 200

    # INCHARGE cannot delete issues
    return jsonify({"error": "Permission denied"}), 403

# -----------------------------------------------------------
# ASSIGN INCHARGE TO ISSUE (Admin only) – Auto Status In Progress
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
    issue.status = "In Progress"
    db.session.commit()

    return jsonify({"message": f"Issue assigned to {incharge.name} and status set to In Progress"}), 200

# -----------------------------------------------------------
# ADD COMMENT TO ISSUE (All roles)
# -----------------------------------------------------------
@issue_bp.route("/<int:issue_id>/comment", methods=["POST"])
@login_required
def add_comment(issue_id):
    issue = Issue.query.get(issue_id)
    if not issue:
        return jsonify({"error": "Issue not found"}), 404

    if current_user.role == "user" and issue.reporter_id != current_user.id:
        return jsonify({"error": "Cannot comment on others' issues"}), 403

    data = request.get_json() or {}
    comment_text = data.get("comment")
    if not comment_text:
        return jsonify({"error": "Missing comment text"}), 400

    comment = Comment(issue_id=issue.id, author_id=current_user.id, comment_text=comment_text)
    db.session.add(comment)
    db.session.commit()

    return jsonify({"message": "Comment added successfully"}), 201

# -----------------------------------------------------------
# GET COMMENTS FOR AN ISSUE
# -----------------------------------------------------------
@issue_bp.route("/<int:issue_id>/comments", methods=["GET"])
@login_required
def get_comments(issue_id):
    issue = Issue.query.get(issue_id)
    if not issue:
        return jsonify({"error": "Issue not found"}), 404

    if current_user.role == "user" and issue.reporter_id != current_user.id:
        return jsonify({"error": "Cannot view comments on others' issues"}), 403

    comments = Comment.query.filter_by(issue_id=issue.id).order_by(Comment.created_at.asc()).all()
    data = [{
        "id": c.id,
        "author": c.author.name,
        "author_role": c.author.role,
        "comment_text": c.comment_text,
        "created_at": c.created_at.strftime("%Y-%m-%d %H:%M")
    } for c in comments]

    return jsonify(data), 200

# -----------------------------------------------------------
# GET ISSUES FOR CURRENT LOGGED-IN USER
# -----------------------------------------------------------
@issue_bp.route("/user", methods=["GET"])
@login_required
def get_user_issues():
    issues = Issue.query.filter_by(reporter_id=current_user.id).order_by(Issue.created_at.desc()).all()
    return jsonify([{
        "id": i.id,
        "title": i.title,
        "description": i.description,
        "status": i.status,
        "category": i.category,
        "incharge": {
            "id": i.assigned_to.id,
            "name": i.assigned_to.name,
            "email": i.assigned_to.email
        } if i.assigned_to else None,
        "created_at": i.created_at.strftime("%Y-%m-%d %H:%M")
    } for i in issues]), 200
