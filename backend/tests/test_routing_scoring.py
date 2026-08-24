from decimal import Decimal
import uuid
import pytest

from smart_helpdesk.db.models.customer_technician_history import CustomerTechnicianHistory
from smart_helpdesk.db.models.technician import Technician
from smart_helpdesk.routing.scoring import (
    calculate_candidate_score,
    compute_history_score,
    compute_location_score,
    compute_rating_score,
    compute_reopen_score,
    compute_workload_score,
)


def test_compute_location_score() -> None:
    # Same zone -> 1.0
    assert compute_location_score("Tower A, Flat 302", "Tower A") == 1.0
    assert compute_location_score("Tower A", "Tower A") == 1.0

    # Common tower prefix -> 0.5
    assert compute_location_score("Tower A, Flat 302", "Tower B") == 0.5

    # Completely different -> 0.2
    assert compute_location_score("Block C, Flat 10", "Phase 9") == 0.2

    # None / empty -> 0.5 neutral
    assert compute_location_score(None, "Tower A") == 0.5
    assert compute_location_score("Tower A", None) == 0.5


def test_compute_rating_score() -> None:
    assert compute_rating_score(Decimal("5.00")) == 1.0
    assert compute_rating_score(Decimal("4.00")) == 0.8
    assert compute_rating_score(Decimal("2.50")) == 0.5
    assert compute_rating_score(None) == 0.7  # neutral prior (3.5 / 5.0)


def test_compute_history_score() -> None:
    # None -> 0.50 neutral
    assert compute_history_score(None) == 0.50

    # Positive history bonus
    pos_hist = CustomerTechnicianHistory(
        customer_id=uuid.uuid4(),
        technician_id=uuid.uuid4(),
        positive_interactions=3,
        negative_interactions=0,
    )
    assert compute_history_score(pos_hist) == 0.95

    # Negative history penalty
    neg_hist = CustomerTechnicianHistory(
        customer_id=uuid.uuid4(),
        technician_id=uuid.uuid4(),
        positive_interactions=0,
        negative_interactions=2,
    )
    assert compute_history_score(neg_hist) == 0.20


def test_compute_reopen_score() -> None:
    # completed_jobs = 0 -> 0.70 neutral prior, no division by zero
    assert compute_reopen_score(completed_jobs=0, reopened_jobs=0) == 0.70

    # Perfect track record: 10 jobs, 0 reopens -> 1.0
    assert compute_reopen_score(completed_jobs=10, reopened_jobs=0) == 1.0

    # 10 jobs, 2 reopens (20% reopen rate) -> 0.80
    assert compute_reopen_score(completed_jobs=10, reopened_jobs=2) == 0.80

    # 10 jobs, 10 reopens -> 0.0
    assert compute_reopen_score(completed_jobs=10, reopened_jobs=10) == 0.0


def test_compute_workload_score() -> None:
    # 0 / 5 jobs -> 1.0
    assert compute_workload_score(current_workload=0, max_workload=5) == 1.0

    # 1 / 5 jobs (20% utilization) -> 0.80
    assert compute_workload_score(current_workload=1, max_workload=5) == 0.80

    # 4 / 5 jobs (80% utilization) -> 0.20
    assert compute_workload_score(current_workload=4, max_workload=5) == 0.20


def test_calculate_candidate_score_total_and_breakdown() -> None:
    tech = Technician(
        full_name="Top Plumber",
        email="top@example.com",
        phone_number="+19999999999",
        is_active=True,
        is_on_duty=True,
        current_zone="Tower A",
        overall_rating=Decimal("4.80"),
        current_workload=1,
        max_workload=5,
        completed_jobs_count=20,
        reopened_jobs_count=1,
    )
    tech.id = uuid.uuid4()

    hist = CustomerTechnicianHistory(
        customer_id=uuid.uuid4(),
        technician_id=tech.id,
        positive_interactions=2,
        negative_interactions=0,
    )

    total_score, breakdown = calculate_candidate_score(tech, "Tower A, Flat 401", hist)

    # Location = 1.0 * 20 = 20.0
    assert breakdown.location == 20.0
    # Rating = (4.8/5.0) * 25 = 24.0
    assert breakdown.rating == 24.0
    # History = (0.5 + 2*0.15) * 25 = 0.80 * 25 = 20.0
    assert breakdown.customer_history == 20.0
    # Reopen = (1 - 1/20) * 15 = 0.95 * 15 = 14.25
    assert breakdown.reopen_rate == 14.25
    # Workload = (1 - 1/5) * 15 = 0.80 * 15 = 12.0
    assert breakdown.workload == 12.0

    assert total_score == round(20.0 + 24.0 + 20.0 + 14.25 + 12.0, 2)
    assert 0.0 <= total_score <= 100.0
