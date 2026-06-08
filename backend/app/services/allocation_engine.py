"""
Allocation Engine — the core business logic for matching teams to projects and guides.

Since teams now propose their own projects, the engine only pairs the Team's Project 
with the best-suited Faculty Guide based on domain and workload.
"""

import random
from sqlalchemy.orm import Session
from app.models import (
    Team, TeamMember, Student, StudentSpecialization,
    Project, ProjectSpecialization,
    Guide, GuideDomain, GUIDE_CAPACITY,
    Allocation, AllocationMode, TeamStatus,
)


class AllocationEngine:
    """Handles guide allocation for teams and their custom projects."""

    def __init__(self, db: Session):
        self.db = db

    def run(self, mode: str = "smart") -> dict:
        """
        Run the allocation engine.
        Returns summary of allocations made.
        """
        # Clear any existing non-frozen allocations
        self.db.query(Allocation).filter(Allocation.is_frozen == False).delete()
        self.db.commit()

        # Reset project allocation flags for non-frozen projects
        frozen_project_ids = [
            a.project_id for a in
            self.db.query(Allocation).filter(Allocation.is_frozen == True).all()
        ]
        self.db.query(Project).filter(
            Project.id.notin_(frozen_project_ids) if frozen_project_ids else True
        ).update({"is_allocated": False}, synchronize_session="fetch")
        self.db.commit()

        # Get eligible teams (3-4 members, has a project, not already frozen-allocated)
        frozen_team_ids = [
            a.team_id for a in
            self.db.query(Allocation).filter(Allocation.is_frozen == True).all()
        ]
        all_teams = self.db.query(Team).all()
        eligible_teams = []
        for team in all_teams:
            if team.id in frozen_team_ids:
                continue
            member_count = self.db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
            project = self.db.query(Project).filter(Project.team_id == team.id).first()
            if member_count >= 3 and project:
                eligible_teams.append((team, project))

        # Get guides with capacity
        all_guides = self.db.query(Guide).all()

        allocations = self._smart_allocation(eligible_teams, all_guides)

        # Save allocations
        for alloc_data in allocations:
            allocation = Allocation(
                team_id=alloc_data["team_id"],
                project_id=alloc_data["project_id"],
                guide_id=alloc_data["guide_id"],
                mode=AllocationMode.SMART,
                score=alloc_data.get("score", 0.0),
                reasoning=alloc_data.get("reasoning", ""),
                is_frozen=False,
            )
            self.db.add(allocation)

            # Mark project as allocated
            project = self.db.query(Project).filter(Project.id == alloc_data["project_id"]).first()
            if project:
                project.is_allocated = True

            # Update team status
            team = self.db.query(Team).filter(Team.id == alloc_data["team_id"]).first()
            if team:
                team.status = TeamStatus.ALLOCATED

        self.db.commit()

        return {
            "total_teams": len(eligible_teams),
            "allocated_teams": len(allocations),
            "unallocated_teams": len(eligible_teams) - len(allocations),
            "mode_used": "smart",
        }

    def _get_guide_domains(self, guide: Guide) -> set[str]:
        """Get guide's domains of expertise."""
        domains = self.db.query(GuideDomain).filter(GuideDomain.guide_id == guide.id).all()
        return {d.domain.lower() for d in domains}

    def _get_guide_load(self, guide: Guide) -> int:
        """Get current allocation load of a guide."""
        return self.db.query(Allocation).filter(Allocation.guide_id == guide.id).count()

    def _find_best_guide(self, project_domain: str, guides: list[Guide], allocated_guide_loads: dict) -> Guide | None:
        """Find the best guide for a project based on domain match and workload."""
        available_guides = []
        for guide in guides:
            current_load = allocated_guide_loads.get(guide.id, self._get_guide_load(guide))
            if current_load < guide.max_capacity:
                domains = self._get_guide_domains(guide)
                domain_match = 1 if project_domain.lower() in domains else 0
                available_guides.append((guide, domain_match, current_load))

        if not available_guides:
            return None

        # Sort: domain match DESC, load ASC
        available_guides.sort(key=lambda x: (-x[1], x[2]))

        # Get best candidates (same domain match and load)
        best_match = available_guides[0][1]
        best_load = available_guides[0][2]
        best_candidates = [g for g, m, l in available_guides if m == best_match and l == best_load]

        return random.choice(best_candidates)

    def _smart_allocation(self, eligible_teams: list[tuple[Team, Project]], guides: list[Guide]) -> list[dict]:
        """
        Smart allocation simply pairs the team's custom project to the best available guide.
        """
        allocations = []
        guide_loads = {}

        for team, project in eligible_teams:
            guide = self._find_best_guide(project.domain, guides, guide_loads)
            if guide is None:
                continue

            guide_loads[guide.id] = guide_loads.get(guide.id, self._get_guide_load(guide)) + 1
            
            domains = self._get_guide_domains(guide)
            domain_matched = "Yes" if project.domain.lower() in domains else "No"
            
            allocations.append({
                "team_id": team.id,
                "project_id": project.id,
                "guide_id": guide.id,
                "score": 100.0 if domain_matched == "Yes" else 50.0,
                "reasoning": f"Assigned Guide {guide.name} to team's project. Domain Match: {domain_matched}.",
            })

        return allocations

    # ─── Freeze / Reset ─────────────────────────────────────────────

    @staticmethod
    def freeze_allocations(db: Session) -> int:
        """Freeze all current allocations. Returns count frozen."""
        allocations = db.query(Allocation).filter(Allocation.is_frozen == False).all()
        count = 0
        for alloc in allocations:
            alloc.is_frozen = True
            # Lock the project
            project = db.query(Project).filter(Project.id == alloc.project_id).first()
            if project:
                project.is_locked = True
            # Freeze the team
            team = db.query(Team).filter(Team.id == alloc.team_id).first()
            if team:
                team.status = TeamStatus.FROZEN
            count += 1
        db.commit()
        return count

    @staticmethod
    def reset_allocations(db: Session) -> int:
        """Reset (unfreeze and delete) all allocations. Returns count reset."""
        allocations = db.query(Allocation).all()
        count = len(allocations)

        # Unlock projects
        for alloc in allocations:
            project = db.query(Project).filter(Project.id == alloc.project_id).first()
            if project:
                project.is_allocated = False
                project.is_locked = False
            team = db.query(Team).filter(Team.id == alloc.team_id).first()
            if team:
                team.status = TeamStatus.OPEN

        db.query(Allocation).delete()
        db.commit()
        return count
