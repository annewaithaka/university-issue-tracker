from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()
bcrypt = Bcrypt()

# -----------------------------------------------------------
# USER MODEL
# -----------------------------------------------------------
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default='user')
    department = db.Column(db.String(100))
    year = db.Column(db.String(20))

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f"<User {self.name}>"


# -----------------------------------------------------------
# ISSUE MODEL
# -----------------------------------------------------------
class Issue(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='Pending')
    category = db.Column(db.String(100))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    # Foreign keys
    reporter_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    assigned_to_id = db.Column(db.Integer, db.ForeignKey('user.id'))

    # Relationships
    reporter = db.relationship(
        'User',
        foreign_keys=[reporter_id],
        backref='reported_issues'
    )

    assigned_to = db.relationship(
        'User',
        foreign_keys=[assigned_to_id],
        backref='assigned_issues'
    )

    # 🔥 Add this relationship for comments
    comments = db.relationship(
        "Comment",
        backref=db.backref("issue", passive_deletes=True),
        cascade="all, delete-orphan"
    )

    def mark_complete(self):
        """Mark issue as complete and record completion time."""
        self.status = 'Completed'
        self.completed_at = datetime.utcnow()

    def __repr__(self):
        return f"<Issue {self.title}>"

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    issue_id = db.Column(
        db.Integer,
        db.ForeignKey('issue.id', ondelete="CASCADE"),   # <-- ADD THIS
        nullable=False
    )
    author_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    comment_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    author = db.relationship('User')

    def __repr__(self):
        return f"<Comment by {self.author.name} on Issue {self.issue_id}>"
