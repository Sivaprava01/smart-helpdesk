from decimal import Decimal
from typing import TYPE_CHECKING

from smart_helpdesk.routing.constants import (
    DEFAULT_HISTORY_NEUTRAL,
    DEFAULT_LOCATION_NEUTRAL,
    DEFAULT_RATING_PRIOR,
    DEFAULT_REOPEN_PRIOR,
    WEIGHT_CUSTOMER_HISTORY,
    WEIGHT_LOCATION,
    WEIGHT_RATING,
    WEIGHT_REOPEN_RATE,
    WEIGHT_WORKLOAD,
)
from smart_helpdesk.routing.schemas import ScoreBreakdown

if TYPE_CHECKING:
    from smart_helpdesk.db.models.customer_technician_history import (
        CustomerTechnicianHistory,
    )
    from smart_helpdesk.db.models.technician import Technician


def compute_location_score(ticket_location: str | None, technician_zone: str | None) -> float:
    """Computes a normalized location proximity score [0.0, 1.0].

    V1 Zone Approximation:
    - Same zone or substring match -> 1.0 (100%)
    - Known related/adjacent zone -> 0.5 (50%)
    - Different zone -> 0.2 (20%)
    - Unspecified / neutral -> 0.5 (50%)
    """
    if not ticket_location or not technician_zone:
        return DEFAULT_LOCATION_NEUTRAL

    t_loc = ticket_location.strip().lower()
    z_loc = technician_zone.strip().lower()

    if not t_loc or not z_loc:
        return DEFAULT_LOCATION_NEUTRAL

    if z_loc in t_loc or t_loc in z_loc:
        return 1.0

    # Check for common zone/tower prefix match (e.g. "tower a" vs "tower b" sharing residential complex)
    t_tokens = set(t_loc.replace(",", " ").split())
    z_tokens = set(z_loc.replace(",", " ").split())
    common = t_tokens.intersection(z_tokens)
    if common:
        return 0.5

    return 0.2


def compute_rating_score(overall_rating: Decimal | float | None) -> float:
    """Computes a normalized customer rating score [0.0, 1.0].

    - 5.0 rating -> 1.0
    - 4.0 rating -> 0.8
    - None (new technician) -> neutral default prior (3.5 / 5.0 = 0.70)
    """
    if overall_rating is None:
        return round(DEFAULT_RATING_PRIOR / 5.0, 4)

    val = float(overall_rating)
    clamped = min(max(val / 5.0, 0.0), 1.0)
    return round(clamped, 4)


def compute_history_score(history: "CustomerTechnicianHistory | None") -> float:
    """Computes a normalized customer-technician pairwise affinity score [0.0, 1.0].

    - No history record -> neutral default (0.50)
    - Net positive interactions -> bonus above 0.50 (up to 1.0)
    - Net negative interactions -> penalty below 0.50 (down to 0.0)
    """
    if history is None:
        return DEFAULT_HISTORY_NEUTRAL

    net = history.positive_interactions - history.negative_interactions
    score = DEFAULT_HISTORY_NEUTRAL + (net * 0.15)
    return round(min(max(score, 0.0), 1.0), 4)


def compute_reopen_score(completed_jobs: int, reopened_jobs: int) -> float:
    """Computes a normalized first-time-fix/completion quality score [0.0, 1.0].

    - completed_jobs == 0 -> neutral default prior (0.70) without division-by-zero
    - Lower reopen rate -> higher score (0% reopens = 1.0, 100% reopens = 0.0)
    """
    if completed_jobs <= 0:
        return DEFAULT_REOPEN_PRIOR

    raw_reopen_rate = min(max(reopened_jobs / completed_jobs, 0.0), 1.0)
    return round(1.0 - raw_reopen_rate, 4)


def compute_workload_score(current_workload: int, max_workload: int) -> float:
    """Computes a normalized workload capacity score [0.0, 1.0].

    - Lower utilization -> higher score for load balancing
    - 0% utilization -> 1.0
    - 80% utilization -> 0.2
    """
    if max_workload <= 0:
        return 0.0

    utilization = min(max(current_workload / max_workload, 0.0), 1.0)
    return round(1.0 - utilization, 4)


def calculate_candidate_score(
    technician: "Technician",
    ticket_location: str,
    history: "CustomerTechnicianHistory | None",
) -> tuple[float, ScoreBreakdown]:
    """Calculates weighted multi-factor points out of 100.0 and returns total score + breakdown."""
    norm_location = compute_location_score(ticket_location, technician.current_zone)
    norm_rating = compute_rating_score(technician.overall_rating)
    norm_history = compute_history_score(history)
    norm_reopen = compute_reopen_score(technician.completed_jobs_count, technician.reopened_jobs_count)
    norm_workload = compute_workload_score(technician.current_workload, technician.max_workload)

    loc_pts = round(norm_location * WEIGHT_LOCATION, 2)
    rate_pts = round(norm_rating * WEIGHT_RATING, 2)
    hist_pts = round(norm_history * WEIGHT_CUSTOMER_HISTORY, 2)
    reopen_pts = round(norm_reopen * WEIGHT_REOPEN_RATE, 2)
    workload_pts = round(norm_workload * WEIGHT_WORKLOAD, 2)

    total_score = round(loc_pts + rate_pts + hist_pts + reopen_pts + workload_pts, 2)

    breakdown = ScoreBreakdown(
        location=loc_pts,
        rating=rate_pts,
        customer_history=hist_pts,
        reopen_rate=reopen_pts,
        workload=workload_pts,
    )
    return total_score, breakdown
