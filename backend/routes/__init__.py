from .auth_routes import auth_bp
from .issue_routes import issue_bp
from .incharge_routes import incharge_bp

def register_routes(app):
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(issue_bp, url_prefix="/api/issues")
    app.register_blueprint(incharge_bp, url_prefix="/api/incharge")
