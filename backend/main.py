from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from database.session import engine, Base
from api.v1.endpoints import auth, connections, research, chat
from routes import profile, post, notification, group, user, topuni, events
from routes import postReaction
from fastapi.staticfiles import StaticFiles
from api.v1.endpoints import search
from api.v1.endpoints.chatbot import huggingface
from routes import assistant  # Import the new assistant routes

app = FastAPI()

# Mount directories for other uploads that are still stored locally
app.mount("/uploads/media", StaticFiles(directory="uploads/media"), name="media")
app.mount("/uploads/document", StaticFiles(directory="uploads/document"), name="document")
app.mount("/uploads/event_images", StaticFiles(directory="uploads/event_images"), name="event_images") 
app.mount("/uploads/research_papers", StaticFiles(directory="uploads/research_papers"), name="research_papers")


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://u-connect.netlify.app"],  # Adjust for your frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Create tables
Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(profile.router, prefix="/profile", tags=["User Profile"])
app.include_router(post.router,prefix="/posts", tags=["Posts"])
app.include_router(postReaction.router, prefix="/interactions", tags=["Post Interactions"])
app.include_router(connections.router, prefix="/connections", tags=["Connections"])
app.include_router(research.router, prefix="/research", tags=["Research"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(notification.router, prefix="/notifications", tags=["Notifications"])
app.include_router(search.router, prefix="/search", tags=["Search"])
app.include_router(huggingface.router, prefix="/chatbot", tags=["Chatbot"])
app.include_router(group.router, prefix="/universities", tags=["University Groups"])
app.include_router(user.router, prefix="/user", tags=["Username"])
app.include_router(topuni.router, prefix="/top", tags=["Top Uni"])
app.include_router(events.router, prefix="/top", tags=["Events"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["Assistant"])  # Add the new assistant router
