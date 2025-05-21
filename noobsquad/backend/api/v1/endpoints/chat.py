# routers/chat_router.py

from fastapi import APIRouter, Depends, WebSocket, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.dependencies import get_db
from api.v1.endpoints.auth import get_current_user
from services.chat_service import fetch_conversations, fetch_chat_history
from services.websocket_service import connect_socket, disconnect_socket, handle_chat_message
from services.upload_service import validate_and_upload
import json
from datetime import datetime, timezone
from typing import Dict, List, Optional
from schemas.chat import MessageOut, ConversationOut, MessageType as SchemaMessageType
from pathlib import Path
from utils.supabase import upload_file_to_supabase
from services.FileHandler import generate_secure_filename
from schemas.chat import MessageOut, ConversationOut
from fastapi.websockets import WebSocketDisconnect

router = APIRouter()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    await connect_socket(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            await handle_chat_message(db, user_id, data)
    except WebSocketDisconnect:
        await disconnect_socket(user_id)
    except Exception as e:
        await disconnect_socket(user_id)
        raise e

@router.get("/chat/conversations", response_model=List[ConversationOut])
async def get_conversations(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return await fetch_conversations(db, current_user.id)

@router.get("/chat/history/{friend_id}", response_model=List[MessageOut])
async def get_chat_history(friend_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return await fetch_chat_history(db, current_user.id, friend_id)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Generate a secure filename
        ext = Path(file.filename).suffix.lower()
        filename = generate_secure_filename(file.filename, ext)
        
        # Upload to Supabase
        file_url = await upload_file_to_supabase(file, filename, section="chat")
        return {"file_url": file_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
