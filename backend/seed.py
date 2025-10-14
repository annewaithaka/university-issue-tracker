from app import app, db
from models import User, Incharge

with app.app_context():
    # Drop and recreate all tables
    db.drop_all()
    db.create_all()

    # Seed admin and user accounts
    admin = User(name="Admin", email="admin@kca.ac.ke", role="admin")
    admin.set_password("admin123")

    alice = User(name="Alice", email="alice@kca.ac.ke", role="user")
    alice.set_password("alice123")

    # Seed incharges
    incharge1 = Incharge(name="Dr. Jane Doe", department="Computer Science", email="jane.doe@kca.ac.ke")
    incharge2 = Incharge(name="Mr. John Smith", department="Business", email="john.smith@kca.ac.ke")

    # Commit all to database
    db.session.add_all([admin, alice, incharge1, incharge2])
    db.session.commit()

    print("✅ Admin, Alice, and incharges created successfully!")
    print("Users:", User.query.all())
    print("Incharges:", Incharge.query.all())
