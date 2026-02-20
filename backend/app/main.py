from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.api import auth, guests, events, rsvp


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting Wedding App API v{settings.VERSION}")
    yield
    print("Shutting down Wedding App API")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Wedding RSVP & management API",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(guests.router, prefix="/api/guests", tags=["Guests"])
app.include_router(events.router, prefix="/api/events", tags=["Events"])
app.include_router(rsvp.router, prefix="/api/rsvp", tags=["RSVP"])


@app.get("/")
async def root():
    return {"message": "Wedding App API", "version": settings.VERSION}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.VERSION}
