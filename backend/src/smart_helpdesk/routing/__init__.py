"""Technician routing and deterministic ranking domain package."""

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
    ExclusionReason,
)
from smart_helpdesk.routing.eligibility import (
    evaluate_technician_eligibility,
    filter_eligible_technicians,
)
from smart_helpdesk.routing.schemas import (
    ExcludedCandidate,
    RankedCandidate,
    RecommendedTechnician,
    RoutingPreviewResponse,
    ScoreBreakdown,
)

__all__ = [
    "DEFAULT_HISTORY_NEUTRAL",
    "DEFAULT_LOCATION_NEUTRAL",
    "DEFAULT_RATING_PRIOR",
    "DEFAULT_REOPEN_PRIOR",
    "ExcludedCandidate",
    "ExclusionReason",
    "RankedCandidate",
    "RecommendedTechnician",
    "RoutingPreviewResponse",
    "ScoreBreakdown",
    "WEIGHT_CUSTOMER_HISTORY",
    "WEIGHT_LOCATION",
    "WEIGHT_RATING",
    "WEIGHT_REOPEN_RATE",
    "WEIGHT_WORKLOAD",
    "evaluate_technician_eligibility",
    "filter_eligible_technicians",
]
