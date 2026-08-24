import uuid
from smart_helpdesk.db.models.technician import Technician
from smart_helpdesk.routing.constants import ExclusionReason
from smart_helpdesk.routing.schemas import ExcludedCandidate


def evaluate_technician_eligibility(
    technician: Technician,
    required_category_id: uuid.UUID,
) -> tuple[bool, list[str]]:
    """Evaluates mandatory eligibility criteria for a technician.

    A technician must satisfy ALL 4 rules:
    1. Active status
    2. On-duty status
    3. Category / skill match
    4. Workload capacity available (current_workload < max_workload)

    Returns:
        tuple[bool, list[str]]: (is_eligible, list_of_failure_reasons)
    """
    reasons: list[str] = []

    # Rule 1: Active check
    if not technician.is_active:
        reasons.append(ExclusionReason.TECHNICIAN_INACTIVE.value)

    # Rule 2: On-duty check
    if not technician.is_on_duty:
        reasons.append(ExclusionReason.TECHNICIAN_OFF_DUTY.value)

    # Rule 3: Category / skill match
    supported_category_ids = {c.id for c in technician.categories}
    if required_category_id not in supported_category_ids:
        reasons.append(ExclusionReason.CATEGORY_NOT_SUPPORTED.value)

    # Rule 4: Workload capacity check
    if technician.current_workload >= technician.max_workload:
        reasons.append(ExclusionReason.WORKLOAD_LIMIT_REACHED.value)

    is_eligible = len(reasons) == 0
    return is_eligible, reasons


def filter_eligible_technicians(
    technicians: list[Technician],
    required_category_id: uuid.UUID,
) -> tuple[list[Technician], list[ExcludedCandidate]]:
    """Filters a candidate pool into eligible technicians and excluded candidates with reasons."""
    eligible: list[Technician] = []
    excluded: list[ExcludedCandidate] = []

    for tech in technicians:
        is_eligible, reasons = evaluate_technician_eligibility(tech, required_category_id)
        if is_eligible:
            eligible.append(tech)
        else:
            excluded.append(
                ExcludedCandidate(
                    technician_id=tech.id,
                    technician_name=tech.full_name,
                    reasons=reasons,
                )
            )

    return eligible, excluded
