from decimal import Decimal
import uuid
import pytest

from smart_helpdesk.db.models.customer_technician_history import CustomerTechnicianHistory
from smart_helpdesk.db.models.technician import Technician
from smart_helpdesk.routing.ranking import rank_eligible_technicians


def test_ranking_empty_pool() -> None:
    ranked, rec = rank_eligible_technicians([], "Tower A", {})
    assert ranked == []
    assert rec is None


def test_ranking_order_and_recommendation() -> None:
    tech_a = Technician(
        full_name="Technician High Score",
        email="a@example.com",
        phone_number="+10000000010",
        is_active=True,
        is_on_duty=True,
        current_zone="Tower A",
        overall_rating=Decimal("4.90"),
        current_workload=1,
        max_workload=5,
        completed_jobs_count=30,
        reopened_jobs_count=0,
    )
    tech_a.id = uuid.uuid4()

    tech_b = Technician(
        full_name="Technician Lower Score",
        email="b@example.com",
        phone_number="+10000000011",
        is_active=True,
        is_on_duty=True,
        current_zone="Tower D",
        overall_rating=Decimal("3.80"),
        current_workload=4,
        max_workload=5,
        completed_jobs_count=10,
        reopened_jobs_count=3,
    )
    tech_b.id = uuid.uuid4()

    ranked, rec = rank_eligible_technicians([tech_b, tech_a], "Tower A, Flat 101", {})
    assert len(ranked) == 2
    assert ranked[0].rank == 1
    assert ranked[0].technician_id == tech_a.id
    assert ranked[0].technician_name == "Technician High Score"

    assert ranked[1].rank == 2
    assert ranked[1].technician_id == tech_b.id

    assert rec is not None
    assert rec.technician_id == tech_a.id
    assert rec.total_score == ranked[0].total_score


def test_deterministic_tie_breaking_identical_scores() -> None:
    id1 = uuid.UUID("00000000-0000-0000-0000-000000000001")
    id2 = uuid.UUID("00000000-0000-0000-0000-000000000002")

    tech1 = Technician(
        full_name="Twin Tech 1",
        email="twin1@example.com",
        phone_number="+10000000021",
        is_active=True,
        is_on_duty=True,
        current_zone="Tower A",
        overall_rating=Decimal("4.00"),
        current_workload=2,
        max_workload=5,
        completed_jobs_count=10,
        reopened_jobs_count=0,
    )
    tech1.id = id1

    tech2 = Technician(
        full_name="Twin Tech 2",
        email="twin2@example.com",
        phone_number="+10000000022",
        is_active=True,
        is_on_duty=True,
        current_zone="Tower A",
        overall_rating=Decimal("4.00"),
        current_workload=2,
        max_workload=5,
        completed_jobs_count=10,
        reopened_jobs_count=0,
    )
    tech2.id = id2

    # Pass in both orders, the result must be stably sorted by UUID ascending
    ranked1, _ = rank_eligible_technicians([tech2, tech1], "Tower A", {})
    ranked2, _ = rank_eligible_technicians([tech1, tech2], "Tower A", {})

    assert [r.technician_id for r in ranked1] == [id1, id2]
    assert [r.technician_id for r in ranked2] == [id1, id2]
