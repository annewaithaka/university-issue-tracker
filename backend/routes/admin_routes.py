# backend/routes/admin_routes.py
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from models import db, User, Issue, Comment

admin_bp = Blueprint("admin", __name__)

# -----------------------------------------------------------
# Helper: Check if current user is admin
# -----------------------------------------------------------


def admin_required():
    return current_user.is_authenticated and current_user.role == "admin"

# -----------------------------------------------------------
# USERS CRUD
# -----------------------------------------------------------


@admin_bp.route("/users", methods=["GET"])
@login_required
def get_users():
    if not admin_required():
        return jsonify({"error": "Unauthorized"}), 403

    users = User.query.filter_by(role="user").all()
    data = [{
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "department": u.department,
        "year": u.year
    } for u in users]

    return jsonify(data), 200


@admin_bp.route("/users", methods=["POST"])
@login_required
def create_user():
    if not admin_required():
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json() or {}

    required = ["name", "email", "password", "role"]
    if not all(field in data and data[field] for field in required):
        return jsonify({"error": "Missing required fields"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "User already exists"}), 409

    user = User(
        name=data["name"],
        email=data["email"],
        role=data["role"],
        department=data.get("department"),
        year=data.get("year")
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()

    # SUCCESS MESSAGE THAT TRIGGERS GREEN POPUP
    if user.role == "admin":
        msg = "Admin created successfully!"
    elif user.role == "incharge":
        msg = "Incharge created successfully!"
    else:
        msg = "User created successfully!"

    return jsonify({"message": msg, "id": user.id}), 201


@admin_bp.route("/users/<int:user_id>", methods=["PUT"])
@login_required
def update_user(user_id):
    if not admin_required():
        return jsonify({"error": "Unauthorized"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    user.name = data.get("name", user.name)
    user.email = data.get("email", user.email)

    if data.get("password"):
        user.set_password(data["password"])

    user.role = data.get("role", user.role)
    user.department = data.get("department", user.department)
    user.year = data.get("year", user.year)

    db.session.commit()

    return jsonify({"message": "User updated successfully"}), 200


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@login_required
def delete_user(user_id):
    if not admin_required():
        return jsonify({"error": "Unauthorized"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully"}), 200


# -----------------------------------------------------------
# INCHARGES LIST (admin + incharge)
# -----------------------------------------------------------
@admin_bp.route("/incharges", methods=["GET"])
@login_required
def get_incharges():
    if not admin_required():
        return jsonify({"error": "Unauthorized"}), 403

    incharges = User.query.filter(User.role.in_(["incharge", "admin"])).all()
    data = [{
        "id": i.id,
        "name": i.name,
        "email": i.email,
        "department": i.department,
        "role": i.role
    } for i in incharges]

    return jsonify(data), 200


# -----------------------------------------------------------
# ALL ISSUES
# -----------------------------------------------------------
@admin_bp.route("/issues", methods=["GET"])
@login_required
def get_all_issues():
    if not admin_required():
        return jsonify({"error": "Unauthorized"}), 403

    issues = Issue.query.order_by(Issue.created_at.desc()).all()
    results = []

    for i in issues:
        results.append({
            "id": i.id,
            "title": i.title,
            "description": i.description,
            "category": i.category,
            "status": i.status,
            "created_at": i.created_at.strftime("%Y-%m-%d %H:%M"),
            "completed_at": i.completed_at.strftime("%Y-%m-%d %H:%M") if i.completed_at else None,
            "reporter": {
                "id": i.reporter.id if i.reporter else None,
                "name": i.reporter.name if i.reporter else "Unknown",
                "email": i.reporter.email if i.reporter else None
            },
            "incharge": {
                "id": i.assigned_to.id if i.assigned_to else None,
                "name": i.assigned_to.name if i.assigned_to else "Unassigned",
                "email": i.assigned_to.email if i.assigned_to else None
            }
        })

    return jsonify(results), 200

# -----------------------------------------------------------
# ISSUE DETAIL
# -----------------------------------------------------------
@admin_bp.route("/issues/<int:issue_id>", methods=["GET"])
@login_required
def get_issue_detail(issue_id):
    if current_user.role not in ["admin", "incharge"]:
        return jsonify({"error": "Unauthorized"}), 403

    issue = Issue.query.get(issue_id)
    if not issue:
        return jsonify({"error": "Issue not found"}), 404

    comments = Comment.query.filter_by(
        issue_id=issue.id).order_by(Comment.created_at.asc()).all()

    data = {
        "id": issue.id,
        "title": issue.title,
        "description": issue.description,
        "category": issue.category,
        "status": issue.status,
        "created_at": issue.created_at.strftime("%Y-%m-%d %H:%M"),
        "completed_at": issue.completed_at.strftime("%Y-%m-%d %H:%M") if issue.completed_at else None,
        "reporter": {
            "id": issue.reporter.id if issue.reporter else None,
            "name": issue.reporter.name if issue.reporter else "Unknown",
            "email": issue.reporter.email if issue.reporter else None
        },
        "incharge": {
            "id": issue.assigned_to.id if issue.assigned_to else None,
            "name": issue.assigned_to.name if issue.assigned_to else "Unassigned",
            "email": issue.assigned_to.email if issue.assigned_to else None
        },
        "comments": [{
            "id": c.id,
            "author": c.author.name,
            "author_role": c.author.role,
            "comment_text": c.comment_text,
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M")
        } for c in comments]
    }
    return jsonify(data), 200


# -----------------------------------------------------------
# ADD COMMENT
# -----------------------------------------------------------
@admin_bp.route("/issues/<int:issue_id>/comment", methods=["POST"])
@login_required
def admin_add_comment(issue_id):
    if current_user.role not in ["admin", "incharge"]:
        return jsonify({"error": "Unauthorized"}), 403

    issue = Issue.query.get(issue_id)
    if not issue:
        return jsonify({"error": "Issue not found"}), 404

    data = request.get_json() or {}
    comment_text = data.get("comment")

    if not comment_text:
        return jsonify({"error": "Missing comment text"}), 400

    comment = Comment(
        issue_id=issue.id,
        author_id=current_user.id,
        comment_text=comment_text
    )

    db.session.add(comment)
    db.session.commit()

    return jsonify({"message": "Comment added successfully"}), 201

# -----------------------------------------------------------
# ASSIGN INCHARGE / ADMIN
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
    if not incharge or incharge.role not in ["incharge", "admin"]:
        return jsonify({"error": "Invalid incharge/admin"}), 400

    issue.assigned_to_id = incharge.id
    issue.status = "In Progress"
    db.session.commit()

    return jsonify({
        "message": f"Issue assigned to {incharge.name} successfully!"
    }), 200
