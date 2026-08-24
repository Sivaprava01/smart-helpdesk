from enum import Enum


class ExclusionReason(str, Enum):
    """Controlled exclusion reasons for ineligible routing candidates."""

    TECHNICIAN_INACTIVE = "TECHNICIAN_INACTIVE"
    TECHNICIAN_OFF_DUTY = "TECHNICIAN_OFF_DUTY"
    CATEGORY_NOT_SUPPORTED = "CATEGORY_NOT_SUPPORTED"
    WORKLOAD_LIMIT_REACHED = "WORKLOAD_LIMIT_REACHED"


# Centralized Scoring Weights (Sum = 100.0)
WEIGHT_LOCATION = 20.0
WEIGHT_RATING = 25.0
WEIGHT_CUSTOMER_HISTORY = 25.0
WEIGHT_REOPEN_RATE = 15.0
WEIGHT_WORKLOAD = 15.0

# Neutral Priors for Fair Evaluation of New / Incomplete Records
DEFAULT_RATING_PRIOR = 3.5  # 3.5 / 5.0 = 0.70 normalized
DEFAULT_REOPEN_PRIOR = 0.70  # 70% quality score when 0 completed jobs
DEFAULT_HISTORY_NEUTRAL = 0.50  # 50% neutral when no history pair exists
DEFAULT_LOCATION_NEUTRAL = 0.50  # 50% neutral when zone is unknown/unspecified
