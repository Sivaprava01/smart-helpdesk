from enum import Enum


class TicketStatus(str, Enum):
    """Lifecycle statuses for a service ticket."""

    PENDING = "PENDING"
    ROUTING = "ROUTING"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    AWAITING_CUSTOMER_CONFIRMATION = "AWAITING_CUSTOMER_CONFIRMATION"
    CLOSED = "CLOSED"
    REOPENED = "REOPENED"
    CANCELLED = "CANCELLED"


class AssignmentStatus(str, Enum):
    """Lifecycle statuses for a technician assignment attempt."""

    OFFERED = "OFFERED"
    DEFERRED = "DEFERRED"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class DeclineReason(str, Enum):
    """Controlled decline reasons for technician assignment rejection."""

    BUSY = "BUSY"
    NOT_FEELING_WELL = "NOT_FEELING_WELL"
    ENDING_SHIFT = "ENDING_SHIFT"
    PERSONAL_REASON = "PERSONAL_REASON"
    OTHER = "OTHER"
