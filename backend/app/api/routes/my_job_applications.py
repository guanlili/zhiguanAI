import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    UserJobApplication,
    UserJobApplicationCreate,
    UserJobApplicationPublic,
    UserJobApplicationsPublic,
    UserJobApplicationUpdate,
    Message,
)

router = APIRouter(prefix="/my-job-applications", tags=["my-job-applications"])


@router.get("/", response_model=UserJobApplicationsPublic)
def read_my_job_applications(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve user's job applications (我的进展).
    """
    count_statement = (
        select(func.count())
        .select_from(UserJobApplication)
        .where(UserJobApplication.owner_id == current_user.id)
    )
    count = session.exec(count_statement).one()
    statement = (
        select(UserJobApplication)
        .where(UserJobApplication.owner_id == current_user.id)
        .order_by(UserJobApplication.order.asc(), UserJobApplication.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    user_job_applications = session.exec(statement).all()
    return UserJobApplicationsPublic(data=user_job_applications, count=count)


@router.get("/{id}", response_model=UserJobApplicationPublic)
def read_my_job_application(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Get a specific job application for the current user.
    """
    user_job_application = session.get(UserJobApplication, id)
    if not user_job_application:
        raise HTTPException(status_code=404, detail="Job application not found")
    if user_job_application.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return user_job_application


@router.post("/", response_model=UserJobApplicationPublic)
def create_my_job_application(
    *, session: SessionDep, current_user: CurrentUser, user_job_application_in: UserJobApplicationCreate
) -> Any:
    """
    Create a new job application for the current user.
    """
    user_job_application = UserJobApplication.model_validate(
        user_job_application_in, update={"owner_id": current_user.id}
    )
    session.add(user_job_application)
    session.commit()
    session.refresh(user_job_application)
    return user_job_application


@router.put("/{id}", response_model=UserJobApplicationPublic)
def update_my_job_application(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    user_job_application_in: UserJobApplicationUpdate,
) -> Any:
    """
    Update a job application for the current user.
    """
    user_job_application = session.get(UserJobApplication, id)
    if not user_job_application:
        raise HTTPException(status_code=404, detail="Job application not found")
    if user_job_application.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_dict = user_job_application_in.model_dump(exclude_unset=True)
    update_dict["updated_at"] = datetime.utcnow()
    
    # If status is updated, also update status_updated_at if not provided
    if "status" in update_dict and "status_updated_at" not in update_dict:
        update_dict["status_updated_at"] = datetime.utcnow()
        
    user_job_application.sqlmodel_update(update_dict)
    session.add(user_job_application)
    session.commit()
    session.refresh(user_job_application)
    return user_job_application


@router.delete("/{id}")
def delete_my_job_application(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a job application for the current user.
    """
    user_job_application = session.get(UserJobApplication, id)
    if not user_job_application:
        raise HTTPException(status_code=404, detail="Job application not found")
    if user_job_application.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    session.delete(user_job_application)
    session.commit()
    return Message(message="Job application deleted successfully")
