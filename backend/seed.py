# backend/seed.py
from app import app, db
from models import User, Issue

with app.app_context():
    # Reset database
    db.drop_all()
    db.create_all()

    # --- Create Users ---
    admin = User(name="Admin", email="admin@kca.ac.ke", role="admin")
    admin.set_password("admin123")

    incharge = User(
        name="Eng. Mary Njeri",
        email="mary.njeri@kca.ac.ke",
        role="incharge",
        department="Electrical Engineering"
    )
    incharge.set_password("mary123")

    user = User(
        name="Carl James",
        email="carl@gmail.com",
        role="user",
        department="Electrical Engineering",
        year="2nd Year"
    )
    user.set_password("carl123")

    db.session.add_all([admin, incharge, user])
    db.session.commit()

    # --- Create Sample Issues ---
    issue1 = Issue(
        title="Broken Projector in Lecture Hall",
        description="The projector in Hall 3 is not turning on.",
        category="Equipment",
        status="Pending",
        reporter_id=user.id,          # ✅ corrected field
        assigned_to_id=incharge.id    # optional: assign to incharge
    )

    issue2 = Issue(
        title="Wi-Fi Outage in Lab 2",
        description="No Wi-Fi connectivity in the Computer Lab.",
        category="Network",
        status="Pending",
        reporter_id=user.id,
        assigned_to_id=incharge.id
    )

    issue3 = Issue(
        title="Faulty Socket in Workshop",
        description="Sparks when plugging equipment.",
        category="Maintenance",
        status="Pending",
        reporter_id=user.id,
        assigned_to_id=incharge.id
    )

    db.session.add_all([issue1, issue2, issue3])
    db.session.commit()

    print("✅ Database seeded successfully!")
    print(f"Admin: {admin.email}")
    print(f"Incharge: {incharge.email}")
    print(f"User: {user.email}")
    print("Issues Created:", Issue.query.count())
