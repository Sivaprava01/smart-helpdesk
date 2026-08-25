"""Pydantic schemas package for API request validation and response serialization."""

from smart_helpdesk.schemas.assignment import (
    AssignmentActionResponse,
    AssignmentResponse,
    DeclineRequest,
    ExpiredProcessingResponse,
    FallbackSummary,
)
from smart_helpdesk.schemas.auth import (
    OAuthCallbackRequest,
    OAuthUrlResponse,
    RefreshTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from smart_helpdesk.schemas.customer import (
    CustomerBriefResponse,
    CustomerCreate,
    CustomerResponse,
    CustomerUpdate,
)
from smart_helpdesk.schemas.execution import (
    CompleteWorkRequest,
    ExecutionActionResponse,
)
from smart_helpdesk.schemas.feedback import (
    CustomerResponseRequest,
    ResolutionResponse,
    TicketFeedbackResponse,
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
    "CompleteWorkRequest",
    "CustomerBriefResponse",
    "CustomerCreate",
    "CustomerResponse",
    "CustomerResponseRequest",
    "CustomerUpdate",
    "DeclineRequest",
    "ExecutionActionResponse",
    "ExpiredProcessingResponse",
    "FallbackSummary",
    "OAuthCallbackRequest",
    "OAuthUrlResponse",
    "RefreshTokenRequest",
    "ResolutionResponse",
    "ServiceCategoryBriefResponse",
    "ServiceCategoryCreate",
    "ServiceCategoryResponse",
    "ServiceCategoryUpdate",
    "TechnicianBase",
    "TechnicianCreate",
    "TechnicianResponse",
    "TechnicianUpdate",
    "TicketCreate",
    "TicketFeedbackResponse",
    "TicketResponse",
    "TicketStatusResponse",
    "TicketUpdate",
    "TokenResponse",
    "UserLoginRequest",
    "UserRegisterRequest",
    "UserResponse",
]
