"""
Seed script -- populates the database with:
  - Default teacher admin account
  - Sample domains and specializations
  - Sample projects and guides for testing
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models import *  # noqa
from app.utils.security import hash_password


def seed():
    """Seed the database with initial data."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # -- Default Teacher Account --
        existing = db.query(User).filter(User.email == "admin@spgap.com").first()
        if not existing:
            admin_user = User(
                email="admin@spgap.com",
                hashed_password=hash_password("admin123"),
                role=UserRole.TEACHER,
            )
            db.add(admin_user)
            db.flush()

            admin_teacher = Teacher(
                user_id=admin_user.id,
                name="Admin Teacher",
                employee_id="TEACH001",
                department="CSE",
            )
            db.add(admin_teacher)
            print("[OK] Created admin teacher: admin@spgap.com / admin123")
        else:
            print("[--] Admin teacher already exists")

        # -- Domains & Specializations --
        domain_data = {
            "AI/ML": ["Machine Learning", "Deep Learning", "NLP", "Computer Vision", "Reinforcement Learning"],
            "Web Development": ["Frontend", "Backend", "Full Stack", "React", "Node.js", "Django"],
            "Cybersecurity": ["Network Security", "Ethical Hacking", "Cryptography", "Forensics"],
            "IoT": ["Embedded Systems", "Sensor Networks", "Arduino", "Raspberry Pi"],
            "Cloud Computing": ["AWS", "Azure", "Docker", "Kubernetes", "DevOps"],
            "Data Science": ["Data Analytics", "Big Data", "Data Visualization", "Statistical Modeling"],
            "Blockchain": ["Smart Contracts", "DeFi", "Cryptocurrency", "Ethereum"],
            "Mobile Development": ["Android", "iOS", "Flutter", "React Native"],
        }

        for domain_name, specs in domain_data.items():
            existing_domain = db.query(Domain).filter(Domain.name == domain_name).first()
            if not existing_domain:
                domain = Domain(name=domain_name)
                db.add(domain)
                db.flush()
                for spec_name in specs:
                    db.add(Specialization(name=spec_name, domain_id=domain.id))
                print(f"[OK] Created domain: {domain_name} ({len(specs)} specializations)")
            else:
                print(f"[--] Domain already exists: {domain_name}")

        # -- Sample Projects (Removed: Students will now create their own projects) --


        # -- Sample Guides --
        sample_guides = [
            {"name": "Dr. Priya Sharma", "employee_id": "GUIDE001", "designation": "professor",
             "domains": ["AI/ML", "Data Science"]},
            {"name": "Dr. Rajesh Kumar", "employee_id": "GUIDE002", "designation": "associate_professor",
             "domains": ["Web Development", "Cloud Computing"]},
            {"name": "Prof. Anita Desai", "employee_id": "GUIDE003", "designation": "assistant_professor",
             "domains": ["Cybersecurity", "IoT"]},
            {"name": "Dr. Suresh Patel", "employee_id": "GUIDE004", "designation": "professor",
             "domains": ["Blockchain", "Cloud Computing"]},
            {"name": "Prof. Meera Nair", "employee_id": "GUIDE005", "designation": "associate_professor",
             "domains": ["Mobile Development", "Web Development"]},
        ]

        for guide_data in sample_guides:
            existing_guide = db.query(Guide).filter(Guide.employee_id == guide_data["employee_id"]).first()
            if not existing_guide:
                guide = Guide(
                    name=guide_data["name"],
                    employee_id=guide_data["employee_id"],
                    designation=Designation(guide_data["designation"]),
                )
                db.add(guide)
                db.flush()
                for domain_name in guide_data["domains"]:
                    db.add(GuideDomain(guide_id=guide.id, domain=domain_name))
                print(f"[OK] Created guide: {guide_data['name']}")

        db.commit()
        print("\n[SUCCESS] Seed completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"\n[FAIL] Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
