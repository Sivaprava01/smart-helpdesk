import uuid
import pytest

from smart_helpdesk.db.models.service_category import ServiceCategory
from smart_helpdesk.db.models.technician import Technician
from smart_helpdesk.routing.constants import ExclusionReason
from smart_helpdesk.routing.eligibility import (
    evaluate_technician_eligibility,
    filter_eligible_technicians,
)


@pytest.fixture
def plumbing_category() -> ServiceCategory:
    cat = ServiceCategory(name="Plumbing", is_active=True)
    cat.id = uuid.uuid4()
    return cat


@pytest.fixture
def electrical_category() -> ServiceCategory:
    cat = ServiceCategory(name="Electrical", is_active=True)
    cat.id = uuid.uuid4()
    return cat


def test_eligible_technician_passes_all_checks(plumbing_category: ServiceCategory) -> None:
    tech = Technician(
        full_name="Eligible Tech",
        email="eligible@example.com",
        phone_number="+10000000001",
        is_active=True,
        is_on_duty=True,
        current_workload=2,
        max_workload=5,
        categories=[plumbing_category],
    )
    tech.id = uuid.uuid4()

    is_eligible, reasons = evaluate_technician_eligibility(tech, plumbing_category.id)
    assert is_eligible is True
    assert reasons == []


def test_inactive_technician_is_excluded(plumbing_category: ServiceCategory) -> None:
    tech = Technician(
        full_name="Inactive Tech",
        email="inactive@example.com",
        phone_number="+10000000002",
        is_active=False,
        is_on_duty=True,
        current_workload=1,
        max_workload=5,
        categories=[plumbing_category],
    )
    tech.id = uuid.uuid4()

    is_eligible, reasons = evaluate_technician_eligibility(tech, plumbing_category.id)
    assert is_eligible is False
    assert ExclusionReason.TECHNICIAN_INACTIVE.value in reasons


def test_off_duty_technician_is_excluded(plumbing_category: ServiceCategory) -> None:
    tech = Technician(
        full_name="Off Duty Tech",
        email="offduty@example.com",
        phone_number="+10000000003",
        is_active=True,
        is_on_duty=False,
        current_workload=0,
        max_workload=5,
        categories=[plumbing_category],
    )
    tech.id = uuid.uuid4()

    is_eligible, reasons = evaluate_technician_eligibility(tech, plumbing_category.id)
    assert is_eligible is False
    assert ExclusionReason.TECHNICIAN_OFF_DUTY.value in reasons


def test_unsupported_category_is_excluded(
    plumbing_category: ServiceCategory,
    electrical_category: ServiceCategory,
) -> None:
    tech = Technician(
        full_name="Electrician Only",
        email="elec@example.com",
        phone_number="+10000000004",
        is_active=True,
        is_on_duty=True,
        current_workload=1,
        max_workload=5,
        categories=[electrical_category],
    )
    tech.id = uuid.uuid4()

    # Asking for Plumbing
    is_eligible, reasons = evaluate_technician_eligibility(tech, plumbing_category.id)
    assert is_eligible is False
    assert ExclusionReason.CATEGORY_NOT_SUPPORTED.value in reasons


def test_max_workload_reached_is_excluded(plumbing_category: ServiceCategory) -> None:
    tech = Technician(
        full_name="Overloaded Tech",
        email="overloaded@example.com",
        phone_number="+10000000005",
        is_active=True,
        is_on_duty=True,
        current_workload=5,
        max_workload=5,
        categories=[plumbing_category],
    )
    tech.id = uuid.uuid4()

    is_eligible, reasons = evaluate_technician_eligibility(tech, plumbing_category.id)
    assert is_eligible is False
    assert ExclusionReason.WORKLOAD_LIMIT_REACHED.value in reasons


def test_multiple_exclusion_reasons_returned(
    plumbing_category: ServiceCategory,
    electrical_category: ServiceCategory,
) -> None:
    tech = Technician(
        full_name="Multi-Failure Tech",
        email="fail@example.com",
        phone_number="+10000000006",
        is_active=False,
        is_on_duty=False,
        current_workload=6,
        max_workload=5,
        categories=[electrical_category],
    )
    tech.id = uuid.uuid4()

    is_eligible, reasons = evaluate_technician_eligibility(tech, plumbing_category.id)
    assert is_eligible is False
    assert len(reasons) == 4
    assert ExclusionReason.TECHNICIAN_INACTIVE.value in reasons
    assert ExclusionReason.TECHNICIAN_OFF_DUTY.value in reasons
    assert ExclusionReason.CATEGORY_NOT_SUPPORTED.value in reasons
    assert ExclusionReason.WORKLOAD_LIMIT_REACHED.value in reasons


def test_filter_eligible_technicians_pool(
    plumbing_category: ServiceCategory,
    electrical_category: ServiceCategory,
) -> None:
    tech1 = Technician(
        full_name="Good Tech",
        email="good@example.com",
        phone_number="+10000000007",
        is_active=True,
        is_on_duty=True,
        current_workload=1,
        max_workload=5,
        categories=[plumbing_category],
    )
    tech1.id = uuid.uuid4()

    tech2 = Technician(
        full_name="Off Duty Plumber",
        email="off@example.com",
        phone_number="+10000000008",
        is_active=True,
        is_on_duty=False,
        current_workload=0,
        max_workload=5,
        categories=[plumbing_category],
    )
    tech2.id = uuid.uuid4()

    eligible, excluded = filter_eligible_technicians([tech1, tech2], plumbing_category.id)
    assert len(eligible) == 1
    assert eligible[0].id == tech1.id
    assert len(excluded) == 1
    assert excluded[0].technician_id == tech2.id
    assert ExclusionReason.TECHNICIAN_OFF_DUTY.value in excluded[0].reasons
