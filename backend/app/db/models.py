import uuid
import enum
import secrets
import string
from datetime import datetime

from sqlalchemy import (
    Column, String, Boolean, Integer, Text, DateTime,
    ForeignKey, Enum as SQLEnum, Index,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class Language(str, enum.Enum):
    FR = "fr"
    EN = "en"
    AR = "ar"


class RSVPStatus(str, enum.Enum):
    PENDING = "pending"
    ATTENDING = "attending"
    NOT_ATTENDING = "not_attending"


def generate_rsvp_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(8))


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    language = Column(SQLEnum(Language), nullable=False, default=Language.FR)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<User {self.email}>"


class Guest(Base):
    __tablename__ = "guests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    group_name = Column(String(255), nullable=True, index=True)

    rsvp_code = Column(String(8), unique=True, nullable=False, default=generate_rsvp_code, index=True)
    rsvp_status = Column(SQLEnum(RSVPStatus), nullable=False, default=RSVPStatus.PENDING, index=True)

    plus_one_allowed = Column(Boolean, nullable=False, default=False)
    plus_one_name = Column(String(255), nullable=True)
    plus_one_attending = Column(Boolean, nullable=False, default=False)

    dietary_restrictions = Column(Text, nullable=True)
    message = Column(Text, nullable=True)
    language = Column(SQLEnum(Language), nullable=False, default=Language.FR)

    table_number = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)

    responded_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_guest_name", "last_name", "first_name"),
        Index("idx_guest_rsvp_status", "rsvp_status"),
    )

    def __repr__(self):
        return f"<Guest {self.first_name} {self.last_name}>"


class Event(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    title_fr = Column(String(255), nullable=False)
    title_en = Column(String(255), nullable=False)
    title_ar = Column(String(255), nullable=True)
    description_fr = Column(Text, nullable=True)
    description_en = Column(Text, nullable=True)
    description_ar = Column(Text, nullable=True)
    location = Column(String(500), nullable=True)
    icon = Column(String(50), nullable=True)

    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    is_visible = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_event_sort", "sort_order"),
    )

    def __repr__(self):
        return f"<Event {self.title_en}>"
