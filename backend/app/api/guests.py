from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sqlfunc
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.db.database import get_db
from app.db.models import Guest, RSVPStatus, Language
from app.auth import get_current_user
from app.db.models import User

router = APIRouter()


class GuestCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    group_name: Optional[str] = None
    plus_one_allowed: bool = False
    dietary_restrictions: Optional[str] = None
    language: Language = Language.FR
    table_number: Optional[int] = None
    notes: Optional[str] = None


class GuestUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    group_name: Optional[str] = None
    plus_one_allowed: Optional[bool] = None
    dietary_restrictions: Optional[str] = None
    language: Optional[Language] = None
    table_number: Optional[int] = None
    notes: Optional[str] = None
    rsvp_status: Optional[RSVPStatus] = None


class GuestResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: Optional[str]
    phone: Optional[str]
    group_name: Optional[str]
    rsvp_code: str
    rsvp_status: RSVPStatus
    plus_one_allowed: bool
    plus_one_name: Optional[str]
    plus_one_attending: bool
    dietary_restrictions: Optional[str]
    message: Optional[str]
    language: Language
    table_number: Optional[int]
    notes: Optional[str]
    responded_at: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class GuestStats(BaseModel):
    total: int
    attending: int
    not_attending: int
    pending: int
    plus_ones: int
    total_attending: int


def _guest_to_response(guest: Guest) -> GuestResponse:
    return GuestResponse(
        id=str(guest.id),
        first_name=guest.first_name,
        last_name=guest.last_name,
        email=guest.email,
        phone=guest.phone,
        group_name=guest.group_name,
        rsvp_code=guest.rsvp_code,
        rsvp_status=guest.rsvp_status,
        plus_one_allowed=guest.plus_one_allowed,
        plus_one_name=guest.plus_one_name,
        plus_one_attending=guest.plus_one_attending,
        dietary_restrictions=guest.dietary_restrictions,
        message=guest.message,
        language=guest.language,
        table_number=guest.table_number,
        notes=guest.notes,
        responded_at=guest.responded_at.isoformat() if guest.responded_at else None,
        created_at=guest.created_at.isoformat(),
    )


@router.get("", response_model=list[GuestResponse])
async def list_guests(
    search: Optional[str] = None,
    rsvp_status: Optional[RSVPStatus] = None,
    group_name: Optional[str] = None,
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Guest).order_by(Guest.last_name, Guest.first_name)

    if search:
        pattern = f"%{search}%"
        query = query.where(
            (Guest.first_name.ilike(pattern))
            | (Guest.last_name.ilike(pattern))
            | (Guest.email.ilike(pattern))
        )
    if rsvp_status:
        query = query.where(Guest.rsvp_status == rsvp_status)
    if group_name:
        query = query.where(Guest.group_name == group_name)

    result = await db.execute(query)
    return [_guest_to_response(g) for g in result.scalars().all()]


@router.get("/stats", response_model=GuestStats)
async def get_stats(
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Guest))
    guests = result.scalars().all()

    attending = [g for g in guests if g.rsvp_status == RSVPStatus.ATTENDING]
    plus_ones = sum(1 for g in attending if g.plus_one_attending)

    return GuestStats(
        total=len(guests),
        attending=len(attending),
        not_attending=sum(1 for g in guests if g.rsvp_status == RSVPStatus.NOT_ATTENDING),
        pending=sum(1 for g in guests if g.rsvp_status == RSVPStatus.PENDING),
        plus_ones=plus_ones,
        total_attending=len(attending) + plus_ones,
    )


@router.post("", response_model=GuestResponse, status_code=status.HTTP_201_CREATED)
async def create_guest(
    data: GuestCreate,
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    guest = Guest(**data.model_dump())
    db.add(guest)
    await db.commit()
    await db.refresh(guest)
    return _guest_to_response(guest)


@router.get("/{guest_id}", response_model=GuestResponse)
async def get_guest(
    guest_id: UUID,
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Guest).where(Guest.id == guest_id))
    guest = result.scalar_one_or_none()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    return _guest_to_response(guest)


@router.patch("/{guest_id}", response_model=GuestResponse)
async def update_guest(
    guest_id: UUID,
    data: GuestUpdate,
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Guest).where(Guest.id == guest_id))
    guest = result.scalar_one_or_none()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(guest, field, value)

    await db.commit()
    await db.refresh(guest)
    return _guest_to_response(guest)


@router.delete("/{guest_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_guest(
    guest_id: UUID,
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Guest).where(Guest.id == guest_id))
    guest = result.scalar_one_or_none()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    await db.delete(guest)
    await db.commit()
