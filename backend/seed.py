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

        # -- Sample Projects --
        sample_projects = [
            {"title": "AI-Powered Chatbot for Student Queries", "domain": "AI/ML", "difficulty": "hard",
             "description": "Build an intelligent chatbot that answers academic queries using NLP and ML techniques.",
             "skills": ["NLP", "Machine Learning", "Deep Learning"]},
            {"title": "Smart Campus IoT Dashboard", "domain": "IoT", "difficulty": "medium",
             "description": "Design a real-time dashboard to monitor campus IoT sensors including temperature, occupancy, and energy usage.",
             "skills": ["Sensor Networks", "Arduino", "Data Visualization"]},
            {"title": "Blockchain-Based Certificate Verification", "domain": "Blockchain", "difficulty": "hard",
             "description": "Develop a decentralized certificate verification system using Ethereum smart contracts.",
             "skills": ["Smart Contracts", "Ethereum", "Full Stack"]},
            {"title": "Cybersecurity Threat Detection System", "domain": "Cybersecurity", "difficulty": "hard",
             "description": "Build a network intrusion detection system using machine learning algorithms.",
             "skills": ["Network Security", "Machine Learning", "Forensics"]},
            {"title": "E-Commerce Platform with Recommendation Engine", "domain": "Web Development", "difficulty": "medium",
             "description": "Full-stack e-commerce application with a collaborative filtering recommendation system.",
             "skills": ["React", "Node.js", "Machine Learning"]},
            {"title": "Cloud-Native Microservices Architecture", "domain": "Cloud Computing", "difficulty": "hard",
             "description": "Design and implement a microservices-based application deployed on Kubernetes.",
             "skills": ["Docker", "Kubernetes", "DevOps"]},
            {"title": "Data Analytics Dashboard for COVID-19", "domain": "Data Science", "difficulty": "medium",
             "description": "Interactive dashboard visualizing COVID-19 trends with predictive modeling.",
             "skills": ["Data Analytics", "Data Visualization", "Statistical Modeling"]},
            {"title": "Cross-Platform Mobile Health App", "domain": "Mobile Development", "difficulty": "medium",
             "description": "Build a health tracking app with step counter, diet tracker, and vital signs monitoring.",
             "skills": ["Flutter", "React Native", "Backend"]},
            {"title": "Automated Code Review Tool", "domain": "AI/ML", "difficulty": "hard",
             "description": "AI-powered tool that reviews code for bugs, style issues, and security vulnerabilities.",
             "skills": ["NLP", "Deep Learning", "Full Stack"]},
            {"title": "Smart Traffic Management System", "domain": "IoT", "difficulty": "hard",
             "description": "IoT-based traffic management using real-time sensor data and ML optimization.",
             "skills": ["Embedded Systems", "Machine Learning", "Sensor Networks"]},
        ]

        for proj_data in sample_projects:
            existing_proj = db.query(Project).filter(Project.title == proj_data["title"]).first()
            if not existing_proj:
                project = Project(
                    title=proj_data["title"],
                    domain=proj_data["domain"],
                    description=proj_data["description"],
                    difficulty=DifficultyLevel(proj_data["difficulty"]),
                )
                db.add(project)
                db.flush()
                for skill in proj_data["skills"]:
                    db.add(ProjectSpecialization(project_id=project.id, specialization=skill))
                print(f"[OK] Created project: {proj_data['title']}")

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
