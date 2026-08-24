"""Pydantic schemas package for API request validation and response serialization."""

from smart_helpdesk.schemas.assignment import (
    AssignmentActionResponse,
    AssignmentResponse,
    DeclineRequest,
    ExpiredProcessingResponse,
    FallbackSummary,
)
from smart_helpdesk.schemas.customer import (
    CustomerBriefResponse,
    CustomerCreate,
    CustomerResponse,
    CustomerUpdate,
)
from smart_helpdesk.schemas.service_category import (
    ServiceCategoryBriefResponse,
    ServiceCategoryCreate,
    ServiceCategoryResponse,
    ServiceCategoryUpdate,
)
from smart_helpdesk.schemas.technician import (
    TechnicianBase,
    TechnicianCreate,
    TechnicianResponse,
    TechnicianUpdate,
)
from smart_helpdesk.schemas.ticket import (
    TicketCreate,
    TicketResponse,
    TicketStatusResponse,
    TicketUpdate,
)

__all__ = [
    "AssignmentActionResponse",
    "AssignmentResponse",
    "CustomerBriefResponse",
    "CustomerCreate",
    "CustomerResponse",
    "CustomerUpdate",
    "DeclineRequest",
    "ExpiredProcessingResponse",
    "FallbackSummary",
    "ServiceCategoryBriefResponse",
    "ServiceCategoryCreate",
    "ServiceCategoryResponse",
    "ServiceCategoryUpdate",
    "TechnicianBase",
    "TechnicianCreate",
    "TechnicianResponse",
    "TechnicianUpdate",
    "TicketCreate",
    "TicketResponse",
    "TicketStatusResponse",
    "TicketUpdate",
]
