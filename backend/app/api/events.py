from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.db.database import get_db
from app.db.models import Event
from app.auth import get_current_user
from app.db.models import User

router = APIRouter()


class EventCreate(BaseModel):
    title_fr: str
    title_en: str
    title_ar: Optional[str] = None
    description_fr: Optional[str] = None
    description_en: Optional[str] = None
    description_ar: Optional[str] = None
    location: Optional[str] = None
    icon: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    sort_order: int = 0
    is_visible: bool = True


class EventUpdate(BaseModel):
    title_fr: Optional[str] = None
    title_en: Optional[str] = None
    title_ar: Optional[str] = None
    description_fr: Optional[str] = None
    description_en: Optional[str] = None
    description_ar: Optional[str] = None
    location: Optional[str] = None
    icon: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    sort_order: Optional[int] = None
    is_visible: Optional[bool] = None


class EventResponse(BaseModel):
    id: str
    title_fr: str
    title_en: str
    title_ar: Optional[str]
    description_fr: Optional[str]
    description_en: Optional[str]
    description_ar: Optional[str]
    location: Optional[str]
    icon: Optional[str]
    start_time: str
    end_time: Optional[str]
    sort_order: int
    is_visible: bool

    class Config:
        from_attributes = True


def _event_to_response(event: Event) -> EventResponse:
    return EventResponse(
        id=str(event.id),
        title_fr=event.title_fr,
        title_en=event.title_en,
        title_ar=event.title_ar,
        description_fr=event.description_fr,
        description_en=event.description_en,
        description_ar=event.description_ar,
        location=event.location,
        icon=event.icon,
        start_time=event.start_time.isoformat(),
        end_time=event.end_time.isoformat() if event.end_time else None,
        sort_order=event.sort_order,
        is_visible=event.is_visible,
    )


@router.get("", response_model=list[EventResponse])
async def list_events(db: AsyncSession = Depends(get_db)):
    """Public endpoint: list visible events ordered by sort_order."""
    result = await db.execute(
        select(Event).where(Event.is_visible == True).order_by(Event.sort_order, Event.start_time)
    )
    return [_event_to_response(e) for e in result.scalars().all()]


@router.get("/all", response_model=list[EventResponse])
async def list_all_events(
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint: list all events including hidden."""
    result = await db.execute(select(Event).order_by(Event.sort_order, Event.start_time))
    return [_event_to_response(e) for e in result.scalars().all()]


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    data: EventCreate,
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = Event(**data.model_dump())
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return _event_to_response(event)


@router.patch("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: UUID,
    data: EventUpdate,
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(event, field, value)

    await db.commit()
    await db.refresh(event)
    return _event_to_response(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: UUID,
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.delete(event)
    await db.commit()
