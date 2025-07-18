from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import create_engine, Column, Integer, String, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
import datetime
import os

# Database setup
DATABASE_URL = "sqlite:////data/tracker.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# SQLAlchemy Model
class ItemEvent(Base):
    __tablename__ = "item_events"
    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

Base.metadata.create_all(bind=engine)

# FastAPI app setup
app = FastAPI()

# CORS for local development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models (for request/response validation)
class ItemEventCreate(BaseModel):
    item_name: str

class ItemEventResponse(BaseModel):
    id: int
    item_name: str
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

class TrackableItemSummary(BaseModel):
    name: str
    count: int
    last_event_timestamp: datetime.datetime | None

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# API endpoints
@app.post("/events", response_model=ItemEventResponse)
def create_item_event(item_event: ItemEventCreate, db: Session = Depends(get_db)):
    """Create a new event for a trackable item."""
    new_event = ItemEvent(item_name=item_event.item_name, timestamp=datetime.datetime.now(datetime.timezone.utc))
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

@app.get("/items/today", response_model=list[TrackableItemSummary])
def get_items_today(db: Session = Depends(get_db)):
    """Get a summary of all items tracked today."""
    today = datetime.datetime.now(datetime.timezone.utc).date()
    all_events_today = db.query(ItemEvent).filter(func.date(ItemEvent.timestamp) == today).all()

    item_data = {}
    for event in all_events_today:
        if event.item_name not in item_data:
            item_data[event.item_name] = {"count": 0, "last_event_timestamp": event.timestamp}
        item_data[event.item_name]["count"] += 1
        if event.timestamp > item_data[event.item_name]["last_event_timestamp"]:
            item_data[event.item_name]["last_event_timestamp"] = event.timestamp

    summaries = []
    for name, data in item_data.items():
        summaries.append(TrackableItemSummary(name=name, count=data["count"], last_event_timestamp=data["last_event_timestamp"]))
    
    return summaries

@app.get("/events/all", response_model=list[ItemEventResponse])
def get_all_events(db: Session = Depends(get_db)):
    """Get a list of all events ever tracked."""
    return db.query(ItemEvent).all()

@app.delete("/items/{item_name}/latest", status_code=204)
def delete_latest_item_event(item_name: str, db: Session = Depends(get_db)):
    """Delete the most recent event for a specific item."""
    latest_event = db.query(ItemEvent).filter(ItemEvent.item_name == item_name).order_by(ItemEvent.timestamp.desc()).first()
    if not latest_event:
        raise HTTPException(status_code=404, detail="No events found for this item.")
    db.delete(latest_event)
    db.commit()
    return

@app.delete("/items/{item_name}", status_code=204)
def delete_all_item_events(item_name: str, db: Session = Depends(get_db)):
    """Delete all events for a specific item."""
    db.query(ItemEvent).filter(ItemEvent.item_name == item_name).delete()
    db.commit()
    return

# Serve frontend
# Determine the path to the static files relative to the current file (main.py)
# main.py is in /app/backend, static files are in /app/static
STATIC_FILES_DIR = os.path.join(os.path.dirname(__file__), "..", "static")

if os.path.exists(STATIC_FILES_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_FILES_DIR, "assets")), name="static")

    @app.get("/{catchall:path}")
    def serve_frontend(catchall: str):
        return FileResponse(os.path.join(STATIC_FILES_DIR, "index.html"))
else:
    # CORS for local development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )