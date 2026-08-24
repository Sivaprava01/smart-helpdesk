from typing import TYPE_CHECKING
import uuid

from smart_helpdesk.routing.schemas import (
    RankedCandidate,
    RecommendedTechnician,
    ScoreBreakdown,
)
from smart_helpdesk.routing.scoring import calculate_candidate_score

if TYPE_CHECKING:
    from smart_helpdesk.db.models.customer_technician_history import (
        CustomerTechnicianHistory,
    )
    from smart_helpdesk.db.models.technician import Technician


def rank_eligible_technicians(
    eligible_technicians: list["Technician"],
    ticket_location: str,
    histories_by_tech_id: dict[uuid.UUID, "CustomerTechnicianHistory"],
) -> tuple[list[RankedCandidate], RecommendedTechnician | None]:
    """Scores and deterministically ranks eligible technicians.

    Tie-breaking hierarchy:
    1. Total score (descending)
    2. Location proximity points (descending)
    3. Rating points (descending)
    4. Workload capacity points (descending)
    5. Technician ID string (ascending stable tie-breaker)
    """
    if not eligible_technicians:
        return [], None

    scored_candidates: list[tuple[float, ScoreBreakdown, "Technician"]] = []

    for tech in eligible_technicians:
        history = histories_by_tech_id.get(tech.id)
        total_score, breakdown = calculate_candidate_score(tech, ticket_location, history)
        scored_candidates.append((total_score, breakdown, tech))

    # Sort with deterministic tie-breaking key
    scored_candidates.sort(
        key=lambda item: (
            -item[0],  # 1. Total score descending
            -item[1].location,  # 2. Location descending
            -item[1].rating,  # 3. Rating descending
            -item[1].workload,  # 4. Workload descending
            str(item[2].id),  # 5. Stable ID ascending
        )
    )

    ranked_list: list[RankedCandidate] = []
    for idx, (score, breakdown, tech) in enumerate(scored_candidates, start=1):
        ranked_list.append(
            RankedCandidate(
                rank=idx,
                technician_id=tech.id,
                technician_name=tech.full_name,
                total_score=score,
                score_breakdown=breakdown,
            )
        )

    recommended: RecommendedTechnician | None = None
    if ranked_list:
        top = ranked_list[0]
        recommended = RecommendedTechnician(
            technician_id=top.technician_id,
            technician_name=top.technician_name,
            total_score=top.total_score,
        )

    return ranked_list, recommended
