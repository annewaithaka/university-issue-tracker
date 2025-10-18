from flask import Blueprint, jsonify, request
from models import db, User

# Blueprint registered under /api/incharge in app.py
incharge_bp = Blueprint("incharge", __name__)

# ✅ POST /api/incharge/register
@incharge_bp.route("/register", methods=["POST"])
def register_incharge():
    data = request.get_json()
    name = data.get("name")
    department = data.get("department")
    email = data.get("email")
    contact = data.get("contact")

    if not all([name, department, email, contact]):
        return jsonify({"error": "Missing required fields"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Incharge already registered"}), 409

    new_incharge = User(
        name=name,
        email=email,
        role="incharge",
        department=department
    )
    new_incharge.set_password("default123")  # Default password for now
    db.session.add(new_incharge)
    db.session.commit()

    return jsonify({"message": "Incharge registered successfully"}), 201


# ✅ GET /api/incharge
@incharge_bp.route("/", methods=["GET"])
def get_incharges():
    incharges = User.query.filter_by(role="incharge").all()
    data = [{
        "id": i.id,
        "name": i.name,
        "department": i.department,
        "email": i.email
    } for i in incharges]

    return jsonify(data), 200
