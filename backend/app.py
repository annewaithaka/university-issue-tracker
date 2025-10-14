from flask import Flask, request, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import db, bcrypt, User, Issue
from flask_login import current_user, login_required
from flask import jsonify
import os

# -----------------------------------------------------------
# Initialize Flask app
# -----------------------------------------------------------
app = Flask(__name__)

# -----------------------------------------------------------
# Configuration
# -----------------------------------------------------------
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, "database.db")  # ✅ define this first

app.config['SECRET_KEY'] = 'yoursecretkey'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# ✅ use db_path here
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"


# -----------------------------------------------------------
# Initialize extensions
# -----------------------------------------------------------
db.init_app(app)
bcrypt.init_app(app)

# Flask-Login setup
login_manager = LoginManager(app)
login_manager.login_view = 'login'


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({"error": "Unauthorized. Please log in first."}), 401

# -----------------------------------------------------------
# Default route
# -----------------------------------------------------------


@app.route('/')
def home():
    return jsonify({"message": "University Issue Tracker API is running successfully!"}), 200


# -----------------------------------------------------------
# User routes
# -----------------------------------------------------------
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    department = data.get('department')
    year = data.get('year')

    if not all([name, email, password]):
        return jsonify({"error": "Missing required fields"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    new_user = User(name=name, email=email, department=department, year=year)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    login_user(user)
    return jsonify({"message": f"Welcome {user.name}", "role": user.role}), 200


@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200


@app.route('/me', methods=['GET'])
@login_required
def get_current_user():
    return jsonify({
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    })


@app.route('/current_user', methods=['GET'])
@login_required
def current_user_info():
    user_info = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "department": current_user.department,
        "year": current_user.year
    }
    return jsonify(user_info), 200

# -----------------------------------------------------------
# ISSUE ROUTES
# -----------------------------------------------------------


@app.route('/issues', methods=['POST'])
@login_required
def create_issue():
    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    category = data.get('category')

    if not all([title, description, category]):
        return jsonify({"error": "Missing fields"}), 400

    issue = Issue(
        title=title,
        description=description,
        category=category,
        user_id=current_user.id
    )
    db.session.add(issue)
    db.session.commit()

    return jsonify({"message": "Issue submitted successfully!"}), 201


@app.route('/issues', methods=['GET'])
@login_required
def get_issues():
    if current_user.role == "admin":
        issues = Issue.query.all()
    else:
        issues = Issue.query.filter_by(user_id=current_user.id).all()

    results = []
    for i in issues:
        results.append({
            "id": i.id,
            "title": i.title,
            "description": i.description,
            "category": i.category,
            "status": i.status,
            "incharge": i.incharge.name if i.incharge else None,
            "created_at": i.created_at.strftime("%Y-%m-%d %H:%M")
        })

    return jsonify(results), 200


@app.route('/issues/<int:issue_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def issue_operations(issue_id):
    issue = Issue.query.get(issue_id)

    if request.method == 'GET':
        if not issue:
            return jsonify({"error": "Issue not found"}), 404
        return jsonify({
            "id": issue.id,
            "title": issue.title,
            "description": issue.description,
            "category": issue.category,
            "status": issue.status,
            "user_id": issue.user_id,
            "incharge_id": issue.incharge_id
        }), 200

    elif request.method == 'PUT':
        if current_user.role not in ["admin", "incharge"]:
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json()
        issue.status = data.get('status', issue.status)
        issue.incharge_id = data.get('incharge_id', issue.incharge_id)
        db.session.commit()
        return jsonify({
            "message": "Issue updated successfully",
            "issue": {
                "id": issue.id,
                "status": issue.status,
                "incharge_id": issue.incharge_id
            }
        }), 200

    elif request.method == 'DELETE':
        if current_user.role != "admin":
            return jsonify({"error": "Unauthorized"}), 403
        if not issue:
            return jsonify({"error": "Issue not found"}), 404
        db.session.delete(issue)
        db.session.commit()
        return jsonify({"message": "Issue deleted successfully"}), 200

# -----------------------------------------------------------
# INCHARGE ROUTES
# -----------------------------------------------------------


@app.route('/incharge/register', methods=['POST'])
def register_incharge():
    data = request.get_json()
    name = data.get('name')
    department = data.get('department')
    email = data.get('email')
    contact = data.get('contact')

    if not all([name, department, email, contact]):
        return jsonify({"error": "Missing required fields"}), 400

    # Optional: prevent duplicate incharges
    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({"error": "Incharge already registered"}), 409

    new_incharge = User(
        name=name,
        email=email,
        role="incharge",
        department=department
    )
    new_incharge.set_password("default123")  # default password if needed
    db.session.add(new_incharge)
    db.session.commit()

    return jsonify({"message": "Incharge registered successfully"}), 201


@app.route('/incharge', methods=['GET'])
def get_incharges():
    incharges = User.query.filter_by(role="incharge").all()
    results = []
    for i in incharges:
        results.append({
            "id": i.id,
            "name": i.name,
            "department": i.department,
            "email": i.email,
            "contact": getattr(i, 'contact', None)
        })
    return jsonify(results), 200


# -----------------------------------------------------------
# Run app
# -----------------------------------------------------------
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("✅ Database tables created successfully!")
    app.run(debug=True)
