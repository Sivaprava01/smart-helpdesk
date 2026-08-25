import uuid
from typing import Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from smart_helpdesk.core.security import decode_token
from smart_helpdesk.db.enums import UserRole
from smart_helpdesk.db.models.user import User
from smart_helpdesk.db.session import get_db

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Extracts and validates the current authenticated User from the JWT bearer token."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type for API authentication.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing subject identifier.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed user identifier in token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is currently inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_optional_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """Returns the authenticated User if valid token is provided, else returns None."""
    if not token:
        return None
    try:
        return get_current_user(token=token, db=db)
    except HTTPException:
        return None


def require_roles(allowed_roles: list[UserRole]) -> Callable[[User], User]:
    """Dependency factory that enforces role-based access control."""

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        # Admins always have full platform permissions
        if current_user.role == UserRole.ADMIN:
            return current_user

        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of [{', '.join(r.value for r in allowed_roles)}].",
            )
        return current_user

    return role_checker


# Pre-configured role dependencies
require_authenticated = get_current_user
require_admin = require_roles([UserRole.ADMIN])
require_admin_or_dispatcher = require_roles([UserRole.ADMIN, UserRole.DISPATCHER])
require_technician_or_admin = require_roles([UserRole.TECHNICIAN, UserRole.ADMIN, UserRole.DISPATCHER])
require_customer_or_admin = require_roles([UserRole.CUSTOMER, UserRole.ADMIN, UserRole.DISPATCHER])


def validate_technician_ownership(current_user: User, target_technician_id: uuid.UUID) -> None:
    """Validates that a technician is only accessing or acting on their own assignments."""
    if current_user.role in (UserRole.ADMIN, UserRole.DISPATCHER):
        return
    if current_user.role == UserRole.TECHNICIAN:
        if not current_user.technician_id or current_user.technician_id != target_technician_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Technicians are only authorized to access and execute their own assignments.",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: requires technician or administrative role.",
        )


def validate_customer_ownership(current_user: User, target_customer_id: uuid.UUID) -> None:
    """Validates that a customer is only accessing or acting on their own tickets."""
    if current_user.role in (UserRole.ADMIN, UserRole.DISPATCHER):
        return
    if current_user.role == UserRole.CUSTOMER:
        if not current_user.customer_id or current_user.customer_id != target_customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Customers are only authorized to access and interact with their own tickets.",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: requires customer or administrative role.",
        )
