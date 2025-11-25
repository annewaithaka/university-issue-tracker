# backend/app.py
from flask import Flask, jsonify
from flask_login import LoginManager
from flask_cors import CORS
from sqlalchemy.orm import Session
from models import db, bcrypt, User
from routes.auth_routes import auth_bp
from routes.incharge_routes import incharge_bp
from routes.issue_routes import issue_bp
from routes.admin_routes import admin_bp
import os

# -----------------------------------------------------------
# Initialize Flask app
# -----------------------------------------------------------
app = Flask(__name__)
app.url_map.strict_slashes = False  # disable 308 redirects

# -----------------------------------------------------------
# Configuration
# -----------------------------------------------------------
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, "database.db")

app.config["SECRET_KEY"] = "yoursecretkey"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"

# Session cookie settings for React (withCredentials)
app.config["SESSION_COOKIE_SAMESITE"] = "None"  # must be None for cross-site cookies
app.config["SESSION_COOKIE_SECURE"] = True    # True if HTTPS, False for localhost
app.config["SESSION_COOKIE_HTTPONLY"] = True

# -----------------------------------------------------------
# Enable CORS with credentials support
# -----------------------------------------------------------
CORS(app, supports_credentials=True, origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173"
])

# -----------------------------------------------------------
# Initialize extensions
# -----------------------------------------------------------
db.init_app(app)
bcrypt.init_app(app)

# -----------------------------------------------------------
# Flask-Login setup
# -----------------------------------------------------------
login_manager = LoginManager(app)
login_manager.login_view = "auth.login"


@login_manager.user_loader
def load_user(user_id):
    from sqlalchemy.orm import Session
    with Session(db.engine) as session:
        return session.get(User, int(user_id))


@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({"error": "Unauthorized. Please log in first."}), 401

# -----------------------------------------------------------
# Default route
# -----------------------------------------------------------
@app.route("/")
def home():
    return jsonify({"message": "University Issue Tracker API is running successfully!"}), 200

# -----------------------------------------------------------
# Register Blueprints
# -----------------------------------------------------------
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(incharge_bp, url_prefix="/api/incharge")
app.register_blueprint(issue_bp, url_prefix="/api/issues")
app.register_blueprint(admin_bp, url_prefix="/api/admin")

# -----------------------------------------------------------
# Run app
# -----------------------------------------------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("✅ Database tables created successfully!")

        # Create default admin if not exists
        if not User.query.filter_by(email="admin@kca.ac.ke").first():
            from models import User
            admin_user = User(
                name="Admin",
                email="admin@kca.ac.ke",
                role="admin"
            )
            admin_user.set_password("admin123")
            db.session.add(admin_user)
            db.session.commit()
            print("✅ Default admin created: admin@kca.ac.ke / admin123")

    #app.run(debug=True)
    app.run(debug=True, host="localhost")

