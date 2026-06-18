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
from app.services.team_service import MAX_TEAM_MEMBERS, MIN_TEAM_MEMBERS


class AllocationEngine:
    """Handles guide allocation for teams and their custom projects."""

    MIN_GUIDE_TEAMS = 2
    REQUIRED_GUIDE_SECTIONS = ("A", "B")

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
        query = self.db.query(Project)
        if frozen_project_ids:
            query = query.filter(Project.id.notin_(frozen_project_ids))
        query.update({"is_allocated": False}, synchronize_session="fetch")
        self.db.commit()

        # Get eligible teams (2-3 members, has a project, not already frozen-allocated)
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
            if MIN_TEAM_MEMBERS <= member_count <= MAX_TEAM_MEMBERS and project:
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
            "minimum_teams_per_guide": self.MIN_GUIDE_TEAMS,
        }

    def _get_guide_domains(self, guide: Guide) -> set[str]:
        """Get guide's domains of expertise."""
        domains = self.db.query(GuideDomain).filter(GuideDomain.guide_id == guide.id).all()
        return {d.domain.lower() for d in domains}

    def _get_guide_load(self, guide: Guide) -> int:
        """Get current allocation load of a guide."""
        return self.db.query(Allocation).filter(Allocation.guide_id == guide.id).count()

    def _get_guide_section_loads(self, guide: Guide) -> dict[str, int]:
        """Get current allocation load by team section for a guide."""
        section_loads = {}
        allocations = self.db.query(Allocation).filter(Allocation.guide_id == guide.id).all()
        for allocation in allocations:
            if allocation.team and allocation.team.section:
                section = allocation.team.section.upper()
                section_loads[section] = section_loads.get(section, 0) + 1
        return section_loads

    def _find_best_guide(self, project_domain: str, team_section: str, guides: list[Guide], allocated_guide_loads: dict, guide_section_loads: dict) -> Guide | None:
        """Find the best guide for a project, strictly adhering to section balancing rules."""
        available_guides = []
        for guide in guides:
            current_load = allocated_guide_loads.get(guide.id, self._get_guide_load(guide))
            if current_load < guide.max_capacity:
                # STRICT CONSTRAINT CHECK
                section_loads = guide_section_loads.get(guide.id, {})
                missing_sections = {
                    sec for sec in self.REQUIRED_GUIDE_SECTIONS
                    if section_loads.get(sec, 0) == 0
                }
                remaining_slots = guide.max_capacity - current_load
                
                # If the number of remaining slots is exactly equal to the number of missing required sections,
                # the guide CANNOT accept a team from a section they already have.
                if remaining_slots == len(missing_sections) and team_section.upper() not in missing_sections:
                    continue
                
                domains = self._get_guide_domains(guide)
                domain_match = 1 if project_domain.lower() in domains else 0
                
                # Score the section matching (prefer missing sections)
                section_match = 1 if team_section.upper() in missing_sections else 0
                
                available_guides.append((guide, section_match, domain_match, current_load))

        if not available_guides:
            return None

        # Sort: Section match DESC, Domain match DESC, Load ASC
        available_guides.sort(key=lambda x: (-x[1], -x[2], x[3]))

        best_sec = available_guides[0][1]
        best_dom = available_guides[0][2]
        best_load = available_guides[0][3]
        best_candidates = [g for g, s, d, l in available_guides if s == best_sec and d == best_dom and l == best_load]

        return random.choice(best_candidates)

    def _score_guide_for_project(self, guide: Guide, project_domain: str, current_load: int) -> tuple[int, int]:
        """Score a guide for a project: domain match first, then lighter workload."""
        domains = self._get_guide_domains(guide)
        domain_match = 1 if project_domain.lower() in domains else 0
        return domain_match, -current_load

    def _choose_team_for_guide(
        self,
        guide: Guide,
        unallocated: list[tuple[Team, Project]],
        guide_loads: dict[int, int],
        guide_section_loads: dict[str, int],
    ) -> tuple[Team, Project] | None:
        """Choose the best remaining team for a guide while enforcing strict limits."""
        current_load = guide_loads.get(guide.id, self._get_guide_load(guide))
        section_loads = guide_section_loads.get(guide.id, {})
        
        missing_sections = {
            sec for sec in self.REQUIRED_GUIDE_SECTIONS
            if section_loads.get(sec, 0) == 0
        }
        remaining_slots = guide.max_capacity - current_load
        
        candidates = []
        for team, project in unallocated:
            team_sec = team.section.upper()
            # STRICT CONSTRAINT CHECK
            if remaining_slots == len(missing_sections) and team_sec not in missing_sections:
                continue
                
            domain_match, load_score = self._score_guide_for_project(guide, project.domain, current_load)
            section_match = 1 if team_sec in missing_sections else 0
            candidates.append((team, project, section_match, domain_match, load_score))

        if not candidates:
            return None

        candidates.sort(key=lambda x: (-x[2], -x[3], -x[4], x[0].id))
        return candidates[0][0], candidates[0][1]

    def _build_allocation(self, team: Team, project: Project, guide: Guide) -> dict:
        domains = self._get_guide_domains(guide)
        domain_matched = "Yes" if project.domain.lower() in domains else "No"

        return {
            "team_id": team.id,
            "project_id": project.id,
            "guide_id": guide.id,
            "score": 100.0 if domain_matched == "Yes" else 50.0,
            "reasoning": (
                f"Assigned Guide {guide.name} to team's project. "
                f"Domain Match: {domain_matched}. "
                f"Balanced to keep every guide at minimum {self.MIN_GUIDE_TEAMS} teams when possible."
            ),
        }

    def _smart_allocation(self, eligible_teams: list[tuple[Team, Project]], guides: list[Guide]) -> list[dict]:
        """
        Smart allocation pairs each team's custom project to a guide.
        It first balances guides up to the required minimum load with strict section checks, 
        then falls back to domain/workload matching for the remaining teams.
        """
        allocations = []
        guide_loads = {guide.id: self._get_guide_load(guide) for guide in guides}
        guide_section_loads = {
            guide.id: self._get_guide_section_loads(guide)
            for guide in guides
        }
        unallocated = list(eligible_teams)

        if not guides:
            return allocations

        # First pass: ensure each guide receives at least MIN_GUIDE_TEAMS teams
        # and satisfies their missing section requirements.
        while unallocated:
            under_min_guides = [
                guide for guide in guides
                if (
                    guide_loads.get(guide.id, 0) < self.MIN_GUIDE_TEAMS
                    or any(
                        guide_section_loads.get(guide.id, {}).get(section, 0) == 0
                        for section in self.REQUIRED_GUIDE_SECTIONS
                    )
                )
                and guide_loads.get(guide.id, 0) < guide.max_capacity
            ]
            if not under_min_guides:
                break

            # Sort guides by remaining slots vs missing sections (tightest constraints first)
            # A guide with 1 remaining slot and 1 missing section MUST pick that section NOW.
            def constraint_tightness(g):
                missing = sum(1 for sec in self.REQUIRED_GUIDE_SECTIONS if guide_section_loads.get(g.id, {}).get(sec, 0) == 0)
                remaining = g.max_capacity - guide_loads.get(g.id, 0)
                return remaining - missing

            under_min_guides.sort(key=lambda g: (constraint_tightness(g), guide_loads.get(g.id, 0), g.id))
            made_allocation = False

            for guide in under_min_guides:
                if not unallocated:
                    break

                chosen = self._choose_team_for_guide(guide, unallocated, guide_loads, guide_section_loads)
                if chosen is None:
                    continue

                team, project = chosen
                allocations.append(self._build_allocation(team, project, guide))
                guide_loads[guide.id] = guide_loads.get(guide.id, 0) + 1
                section = team.section.upper()
                
                section_loads = guide_section_loads.get(guide.id, {})
                section_loads[section] = section_loads.get(section, 0) + 1
                guide_section_loads[guide.id] = section_loads
                
                unallocated.remove((team, project))
                made_allocation = True

            if not made_allocation:
                break

        # Second pass: Assign remaining teams based on domain and load limits
        for team, project in unallocated:
            guide = self._find_best_guide(project.domain, team.section, guides, guide_loads, guide_section_loads)
            if guide is None:
                continue

            guide_loads[guide.id] = guide_loads.get(guide.id, 0) + 1
            section = team.section.upper()
            section_loads = guide_section_loads.get(guide.id, {})
            section_loads[section] = section_loads.get(section, 0) + 1
            guide_section_loads[guide.id] = section_loads

            allocations.append(self._build_allocation(team, project, guide))

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
