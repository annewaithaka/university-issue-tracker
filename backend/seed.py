# backend/seed.py
from app import app, db
from models import User, Issue

with app.app_context():
    db.drop_all()
    db.create_all()

    # --- Create Users ---
    admin = User(name="Admin", email="admin@kca.ac.ke", role="admin")
    admin.set_password("admin123")

    incharge = User(name="Eng. Mary Njeri", email="mary.njeri@kca.ac.ke", role="incharge", department="Electrical Engineering")
    incharge.set_password("mary123")

    user = User(name="Carl James", email="carl@gmail.com", role="user", department="Electrical Engineering", year="2nd Year")
    user.set_password("carl123")

    db.session.add_all([admin, incharge, user])
    db.session.commit()

    # --- Create Sample Issues ---
    issue1 = Issue(
        title="Broken Projector in Lecture Hall",
        description="The projector in Hall 3 is not turning on.",
        category="Equipment",
        status="Pending",
        reported_by=user
    )

    issue2 = Issue(
        title="Wi-Fi Outage in Lab 2",
        description="No Wi-Fi connectivity in the Computer Lab.",
        category="Network",
        status="Pending",
        reported_by=user
    )

    issue3 = Issue(
        title="Faulty Socket in Workshop",
        description="Sparks when plugging equipment.",
        category="Maintenance",
        status="Pending",
        reported_by=user
    )

    db.session.add_all([issue1, issue2, issue3])
    db.session.commit()

    print("✅ Database seeded successfully!")
    print(f"Admin: {admin.email}")
    print(f"Incharge: {incharge.email}")
    print(f"User: {user.email}")
    print("Issues Created:", Issue.query.count())
