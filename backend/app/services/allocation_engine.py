"""
Allocation Engine — the core business logic for matching teams to projects and guides.

Implements three modes:
  Mode 1: Random Allocation
  Mode 2: Domain-Based Allocation
  Mode 3: Smart Allocation (default) with scoring formula
"""

import random
from sqlalchemy.orm import Session
from app.models import (
    Team, TeamMember, Student, StudentSpecialization,
    Project, ProjectSpecialization,
    Guide, GuideDomain, GUIDE_CAPACITY,
    Allocation, AllocationMode, TeamStatus,
)
from app.utils.text_match import text_similarity, keyword_in_text


class AllocationEngine:
    """Handles project and guide allocation for teams."""

    def __init__(self, db: Session):
        self.db = db

    def run(self, mode: str = "smart") -> dict:
        """
        Run the allocation engine in the specified mode.
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

        # Get eligible teams (3-4 members, not already frozen-allocated)
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
            if member_count >= 3:
                eligible_teams.append(team)

        # Get available projects
        available_projects = self.db.query(Project).filter(
            Project.is_allocated == False,
            Project.is_locked == False,
        ).all()

        # Get guides with capacity
        all_guides = self.db.query(Guide).all()

        # Smart allocation is the primary (and recommended) mode
        allocations = self._smart_allocation(eligible_teams, available_projects, all_guides)
        mode = "smart"

        # Save allocations
        alloc_mode = AllocationMode(mode) if mode in ("random", "domain", "smart") else AllocationMode.SMART
        for alloc_data in allocations:
            allocation = Allocation(
                team_id=alloc_data["team_id"],
                project_id=alloc_data["project_id"],
                guide_id=alloc_data["guide_id"],
                mode=alloc_mode,
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
            "mode_used": mode,
        }

    def _get_team_domain(self, team: Team) -> str | None:
        """Get the most common domain among team members."""
        members = self.db.query(Student).filter(Student.team_id == team.id).all()
        domains = [m.domain for m in members if m.domain]
        if not domains:
            return None
        # Return most common domain
        return max(set(domains), key=domains.count)

    def _get_team_specializations(self, team: Team) -> set[str]:
        """Get all specializations of team members."""
        members = self.db.query(Student).filter(Student.team_id == team.id).all()
        specs = set()
        for member in members:
            student_specs = self.db.query(StudentSpecialization).filter(
                StudentSpecialization.student_id == member.id
            ).all()
            for s in student_specs:
                specs.add(s.specialization.lower())
        return specs

    def _get_team_preferences(self, team: Team) -> dict[str, int]:
        """Get weighted preferred domains from team members (higher rank = higher weight)."""
        members = self.db.query(Student).filter(Student.team_id == team.id).all()
        prefs: dict[str, int] = {}
        for m in members:
            for pref, weight in [
                (m.pref_domain_1, 3),
                (m.pref_domain_2, 2),
                (m.pref_domain_3, 1),
            ]:
                if pref:
                    key = pref.lower()
                    prefs[key] = prefs.get(key, 0) + weight
        return prefs

    def _get_team_natural_language(self, team: Team) -> str:
        """Collect natural-language interests and skills from all team members."""
        members = self.db.query(Student).filter(Student.team_id == team.id).all()
        parts = []
        for m in members:
            if m.domain_description:
                parts.append(m.domain_description)
            if m.domain:
                parts.append(m.domain)
            specs = self.db.query(StudentSpecialization).filter(
                StudentSpecialization.student_id == m.id
            ).all()
            parts.extend(s.specialization for s in specs)
        return " ".join(parts)

    def _project_text_corpus(self, project: Project) -> str:
        """Build searchable text from project metadata."""
        skills = self._get_project_skills(project)
        return " ".join([
            project.title or "",
            project.description or "",
            project.domain or "",
            " ".join(skills),
        ])

    def _compute_preference_score(self, project_domain: str, team_prefs: dict[str, int]) -> tuple[float, str]:
        """Score preference match with ranked weights (max 20 pts)."""
        domain_lower = project_domain.lower()
        if domain_lower in team_prefs:
            weight = team_prefs[domain_lower]
            score = min(20.0, weight * 6.67)
            return score, f"Direct preference match (weight={weight}, score={score:.1f})"

        # Check if preference keywords appear in natural language context
        return 0.0, "No preference match"

    def _compute_text_match_score(self, team_text: str, project: Project) -> tuple[float, str]:
        """Score natural-language interest overlap (max 15 pts)."""
        if not team_text.strip():
            return 0.0, "No natural-language input"

        project_text = self._project_text_corpus(project)
        similarity = text_similarity(team_text, project_text)
        domain_bonus = 0.0
        if keyword_in_text(project.domain, team_text):
            domain_bonus = 0.3
        combined = min(1.0, similarity + domain_bonus)
        score = round(combined * 15, 1)
        return score, f"Text similarity={similarity:.2f}, domain keyword bonus, score={score}"

    def _get_project_skills(self, project: Project) -> set[str]:
        """Get required skills for a project."""
        skills = self.db.query(ProjectSpecialization).filter(
            ProjectSpecialization.project_id == project.id
        ).all()
        return {s.specialization.lower() for s in skills}

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

    # ─── Mode 1: Random Allocation ──────────────────────────────────

    def _random_allocation(self, teams: list[Team], projects: list[Project], guides: list[Guide]) -> list[dict]:
        """Randomly assign projects and guides to teams."""
        allocations = []
        shuffled_projects = list(projects)
        random.shuffle(shuffled_projects)

        available_projects = list(shuffled_projects)
        guide_loads = {}

        for team in teams:
            if not available_projects:
                break

            project = available_projects.pop(0)
            guide = self._find_best_guide(project.domain, guides, guide_loads)

            if guide is None:
                continue

            guide_loads[guide.id] = guide_loads.get(guide.id, self._get_guide_load(guide)) + 1

            allocations.append({
                "team_id": team.id,
                "project_id": project.id,
                "guide_id": guide.id,
                "score": 0.0,
                "reasoning": "Random allocation",
            })

        return allocations

    # ─── Mode 2: Domain-Based Allocation ────────────────────────────

    def _domain_allocation(self, teams: list[Team], projects: list[Project], guides: list[Guide]) -> list[dict]:
        """Match teams to projects based on domain affinity."""
        allocations = []
        allocated_project_ids = set()
        guide_loads = {}

        for team in teams:
            team_domain = self._get_team_domain(team)
            if not team_domain:
                team_domain = ""

            # Find best matching project
            best_project = None
            for project in projects:
                if project.id in allocated_project_ids:
                    continue
                if project.domain.lower() == team_domain.lower():
                    best_project = project
                    break

            # Fallback to any available project
            if best_project is None:
                for project in projects:
                    if project.id not in allocated_project_ids:
                        best_project = project
                        break

            if best_project is None:
                continue

            guide = self._find_best_guide(best_project.domain, guides, guide_loads)
            if guide is None:
                continue

            guide_loads[guide.id] = guide_loads.get(guide.id, self._get_guide_load(guide)) + 1
            allocated_project_ids.add(best_project.id)

            domain_matched = "Yes" if best_project.domain.lower() == team_domain.lower() else "No"
            allocations.append({
                "team_id": team.id,
                "project_id": best_project.id,
                "guide_id": guide.id,
                "score": 50.0 if domain_matched == "Yes" else 0.0,
                "reasoning": f"Domain-based allocation. Team domain: {team_domain}, "
                             f"Project domain: {best_project.domain}, Domain match: {domain_matched}",
            })

        return allocations

    # ─── Mode 3: Smart Allocation ───────────────────────────────────

    def _team_flexibility(self, team: Team, projects: list[Project]) -> int:
        """Count how many projects match the team's domain (for ordering)."""
        team_domain = self._get_team_domain(team)
        if not team_domain:
            return len(projects)
        return sum(1 for p in projects if p.domain.lower() == team_domain.lower())

    def _smart_allocation(self, teams: list[Team], projects: list[Project], guides: list[Guide]) -> list[dict]:
        """
        Smart allocation using scoring formula:
          score = (domain_match × 50) + (common_specializations × 30)
                + (preference_match up to 20) + (natural_language_match up to 15)

        Teams with fewer domain matches are processed first to improve outcomes at scale (~140 students).
        """
        allocations = []
        allocated_project_ids = set()
        guide_loads = {}

        # Hardest-to-match teams first
        ordered_teams = sorted(teams, key=lambda t: self._team_flexibility(t, projects))

        for team in ordered_teams:
            team_domain = self._get_team_domain(team)
            team_specs = self._get_team_specializations(team)
            team_prefs = self._get_team_preferences(team)
            team_nl_text = self._get_team_natural_language(team)

            scored_projects = []
            for project in projects:
                if project.id in allocated_project_ids:
                    continue

                domain_match = 1 if (team_domain and project.domain.lower() == team_domain.lower()) else 0
                domain_score = domain_match * 50

                # Also check natural language for domain affinity
                if not domain_match and team_nl_text and keyword_in_text(project.domain, team_nl_text):
                    domain_score = 25
                    domain_match = 0.5

                project_skills = self._get_project_skills(project)
                common_specs = len(team_specs.intersection(project_skills))
                spec_score = min(common_specs * 30, 90)

                pref_score, pref_reason = self._compute_preference_score(project.domain, team_prefs)
                text_score, text_reason = self._compute_text_match_score(team_nl_text, project)

                total_score = domain_score + spec_score + pref_score + text_score

                reasoning_parts = [
                    f"Domain match: {domain_match} (score={domain_score})",
                    f"Common specializations: {common_specs} (score={spec_score})",
                    f"Preferences: {pref_reason}",
                    f"Natural language: {text_reason}",
                    f"Total: {total_score}",
                ]

                scored_projects.append({
                    "project": project,
                    "score": total_score,
                    "reasoning": "; ".join(reasoning_parts),
                })

            if not scored_projects:
                continue

            random.shuffle(scored_projects)
            scored_projects.sort(key=lambda x: x["score"], reverse=True)

            best = scored_projects[0]
            best_project = best["project"]

            guide = self._find_best_guide(best_project.domain, guides, guide_loads)
            if guide is None:
                continue

            guide_loads[guide.id] = guide_loads.get(guide.id, self._get_guide_load(guide)) + 1
            allocated_project_ids.add(best_project.id)

            allocations.append({
                "team_id": team.id,
                "project_id": best_project.id,
                "guide_id": guide.id,
                "score": best["score"],
                "reasoning": best["reasoning"],
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
