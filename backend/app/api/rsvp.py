from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.db.database import get_db
from app.db.models import Guest, RSVPStatus, Language

router = APIRouter()


class RSVPLookupResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    rsvp_status: RSVPStatus
    plus_one_allowed: bool
    plus_one_name: Optional[str]
    plus_one_attending: bool
    dietary_restrictions: Optional[str]
    message: Optional[str]
    language: Language


class RSVPSubmit(BaseModel):
    rsvp_code: str
    rsvp_status: RSVPStatus
    plus_one_name: Optional[str] = None
    plus_one_attending: bool = False
    dietary_restrictions: Optional[str] = None
    message: Optional[str] = None


class RSVPResponse(BaseModel):
    success: bool
    message: str


@router.get("/lookup/{rsvp_code}", response_model=RSVPLookupResponse)
async def lookup_rsvp(rsvp_code: str, db: AsyncSession = Depends(get_db)):
    """Public endpoint: look up guest by RSVP code."""
    result = await db.execute(
        select(Guest).where(Guest.rsvp_code == rsvp_code.upper())
    )
    guest = result.scalar_one_or_none()
    if not guest:
        raise HTTPException(status_code=404, detail="RSVP code not found")

    return RSVPLookupResponse(
        id=str(guest.id),
        first_name=guest.first_name,
        last_name=guest.last_name,
        rsvp_status=guest.rsvp_status,
        plus_one_allowed=guest.plus_one_allowed,
        plus_one_name=guest.plus_one_name,
        plus_one_attending=guest.plus_one_attending,
        dietary_restrictions=guest.dietary_restrictions,
        message=guest.message,
        language=guest.language,
    )


@router.post("/submit", response_model=RSVPResponse)
async def submit_rsvp(data: RSVPSubmit, db: AsyncSession = Depends(get_db)):
    """Public endpoint: submit RSVP response."""
    result = await db.execute(
        select(Guest).where(Guest.rsvp_code == data.rsvp_code.upper())
    )
    guest = result.scalar_one_or_none()
    if not guest:
        raise HTTPException(status_code=404, detail="RSVP code not found")

    guest.rsvp_status = data.rsvp_status
    guest.dietary_restrictions = data.dietary_restrictions
    guest.message = data.message
    guest.responded_at = datetime.utcnow()

    if guest.plus_one_allowed:
        guest.plus_one_name = data.plus_one_name
        guest.plus_one_attending = data.plus_one_attending

    await db.commit()

    return RSVPResponse(success=True, message="RSVP submitted successfully")
