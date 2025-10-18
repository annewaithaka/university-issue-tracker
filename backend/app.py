from flask import Flask, jsonify
from flask_login import LoginManager
from flask_cors import CORS
from models import db, bcrypt, User
from routes import register_routes
import os

# -----------------------------------------------------------
# Initialize Flask app
# -----------------------------------------------------------
app = Flask(__name__)

# Disable strict_slashes to prevent redirect 308s
app.url_map.strict_slashes = False

# Enable CORS with credentials support
CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

# -----------------------------------------------------------
# Configuration
# -----------------------------------------------------------
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, "database.db")

app.config['SECRET_KEY'] = 'yoursecretkey'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"

# -----------------------------------------------------------
# Initialize extensions
# -----------------------------------------------------------
db.init_app(app)
bcrypt.init_app(app)
CORS(app, supports_credentials=True)

# -----------------------------------------------------------
# Flask-Login setup
# -----------------------------------------------------------
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
# Register Blueprints (All routes under /api)
# -----------------------------------------------------------
register_routes(app)

# -----------------------------------------------------------
# Run app
# -----------------------------------------------------------
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("✅ Database tables created successfully!")
    app.run(debug=True)
