
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    RecruitmentAnnouncement,
    RecruitmentAnnouncementCreate,
    RecruitmentAnnouncementPublic,
    RecruitmentAnnouncementsPublic,
    RecruitmentAnnouncementUpdate,
)

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.get("/", response_model=RecruitmentAnnouncementsPublic)
def read_announcements(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve recruitment announcements.
    """
    count_statement = select(func.count()).select_from(RecruitmentAnnouncement)
    count = session.exec(count_statement).one()
    statement = select(RecruitmentAnnouncement).offset(skip).limit(limit).order_by(RecruitmentAnnouncement.publish_date.desc())
    announcements = session.exec(statement).all()

    return RecruitmentAnnouncementsPublic(data=announcements, count=count)


@router.get("/{id}", response_model=RecruitmentAnnouncementPublic)
def read_announcement(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Get recruitment announcement by ID.
    """
    announcement = session.get(RecruitmentAnnouncement, id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return announcement


@router.post("/", response_model=RecruitmentAnnouncementPublic)
def create_announcement(
    *, session: SessionDep, current_user: CurrentUser, announcement_in: RecruitmentAnnouncementCreate
) -> Any:
    """
    Create new recruitment announcement.
    """
    announcement = RecruitmentAnnouncement.model_validate(announcement_in)
    session.add(announcement)
    session.commit()
    session.refresh(announcement)
    return announcement


@router.put("/{id}", response_model=RecruitmentAnnouncementPublic)
def update_announcement(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    announcement_in: RecruitmentAnnouncementUpdate,
) -> Any:
    """
    Update a recruitment announcement.
    """
    announcement = session.get(RecruitmentAnnouncement, id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    update_dict = announcement_in.model_dump(exclude_unset=True)
    announcement.sqlmodel_update(update_dict)
    session.add(announcement)
    session.commit()
    session.refresh(announcement)
    return announcement


@router.delete("/{id}")
def delete_announcement(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a recruitment announcement.
    """
    announcement = session.get(RecruitmentAnnouncement, id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    session.delete(announcement)
    session.commit()
    return Message(message="Announcement deleted successfully")
