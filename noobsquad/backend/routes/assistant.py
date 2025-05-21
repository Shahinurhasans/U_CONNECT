from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Optional, List
import os
import shutil
import tempfile
from pydantic import BaseModel
import re
import json
import logging
from dotenv import load_dotenv
import requests

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not found in environment variables")

router = APIRouter()

# Create upload directories if they don't exist
os.makedirs("uploads/pdfs", exist_ok=True)

# Models for request validation
class YouTubeSummarizeRequest(BaseModel):
    youtubeLink: str

class FlashcardRequest(BaseModel):
    text: str
    mode: str

# Helper function to extract video ID from YouTube URL
def extract_video_id(url):
    # Regular expressions to match various YouTube URL formats
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/e\/|youtube\.com\/watch\?.*v=|youtube\.com\/watch\?.*&v=)([^&\n?#]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None

# Gemini API helper function
def query_gemini_model(prompt, max_tokens=1000, temperature=0.7):
    """
    Query Google's Gemini model using the Gemini API
    """
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": temperature
        }
    }
    
    # Gemini API URL with API key as query parameter
    api_url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    
    try:
        response = requests.post(api_url, headers=headers, json=payload)
        response.raise_for_status()  # Raise exception for 4XX/5XX responses
        result = response.json()
        
        # Extract text from Gemini response
        if "candidates" in result and len(result["candidates"]) > 0:
            candidate = result["candidates"][0]
            if "content" in candidate and "parts" in candidate["content"]:
                parts = candidate["content"]["parts"]
                if len(parts) > 0 and "text" in parts[0]:
                    return parts[0]["text"]
        
        # If we couldn't extract text through the expected path
        return {"error": "Unexpected response format from Gemini API"}
    except requests.exceptions.RequestException as e:
        logger.error(f"Error querying Gemini model: {str(e)}")
        if hasattr(response, 'status_code') and response.status_code == 429:
            return {"error": "Rate limit exceeded. Please try again later."}
        return {"error": f"Error querying model: {str(e)}"}

# PDF Q&A endpoint
@router.post("/pdf-qa")
async def pdf_qa(
    background_tasks: BackgroundTasks,
    pdf: UploadFile = File(...),
    question: str = Form(...)
):
    if not pdf.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Create a temporary file to store the uploaded PDF
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    temp_file_path = temp_file.name
    
    try:
        # Write the uploaded file to the temporary file
        with temp_file:
            shutil.copyfileobj(pdf.file, temp_file)
        
        logger.info(f"Processing PDF: {pdf.filename}")
        
        # Extract text from PDF
        try:
            import PyPDF2
            with open(temp_file_path, "rb") as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
        except ImportError:
            raise HTTPException(status_code=500, detail="PyPDF2 not installed. Run: pip install PyPDF2")
        
        # Truncate text if it's too long (Gemini has context limits)
        max_length = 4000
        if len(text) > max_length:
            text = text[:max_length] + "..."
        
        # Use Gemini for Q&A
        prompt = f"PDF Content: {text}\n\nQuestion: {question}\n\nProvide a detailed and accurate answer based only on the information in the PDF content above."
        
        try:
            answer = query_gemini_model(prompt, max_tokens=500)
            
            if isinstance(answer, dict) and "error" in answer:
                raise HTTPException(status_code=500, detail=answer["error"])
                
        except Exception as e:
            logger.error(f"Error with Gemini: {str(e)}")
            answer = "Sorry, I couldn't process this PDF. Please try with a different file or question."
        
        # Schedule cleanup of temporary file
        background_tasks.add_task(os.unlink, temp_file_path)
        
        return {"answer": answer}
    
    except Exception as e:
        logger.error(f"Error in PDF Q&A: {str(e)}")
        # Ensure temp file is deleted even if an error occurs
        background_tasks.add_task(os.unlink, temp_file_path)
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

# YouTube Video Summarizer endpoint
@router.post("/youtube-summarize")
async def youtube_summarize(request: YouTubeSummarizeRequest):
    try:
        if not request.youtubeLink:
            raise HTTPException(status_code=400, detail="YouTube link is required")
        
        video_id = extract_video_id(request.youtubeLink)
        
        if not video_id:
            raise HTTPException(status_code=400, detail="Invalid YouTube URL")
        
        logger.info(f"Processing YouTube video: {video_id}")
        
        # Get transcript
        try:
            from youtube_transcript_api import YouTubeTranscriptApi
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            transcript = " ".join([item["text"] for item in transcript_list])
        except ImportError:
            raise HTTPException(status_code=500, detail="youtube-transcript-api not installed. Run: pip install youtube-transcript-api")
        except Exception as e:
            logger.error(f"Error fetching transcript: {str(e)}")
            raise HTTPException(
                status_code=400, 
                detail="Could not fetch transcript for this video. It may not have captions available."
            )
        
        # Truncate transcript if it's too long
        max_length = 4000
        if len(transcript) > max_length:
            transcript = transcript[:max_length] + "..."
        
        # Use Gemini for summarization
        prompt = f"You are a YouTube video summarizer. Summarize the following transcript in about 250 words, highlighting the key points: {transcript}"
        
        try:
            summary = query_gemini_model(prompt, max_tokens=300, temperature=0.5)
            
            if isinstance(summary, dict) and "error" in summary:
                raise HTTPException(status_code=500, detail=summary["error"])
                
        except Exception as e:
            logger.error(f"Error with Gemini: {str(e)}")
            summary = "Sorry, I couldn't summarize this video. Please try with a different video."
        
        return {"summary": summary}
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in YouTube summarizer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error summarizing video: {str(e)}")

# Flashcard Generator endpoint
@router.post("/generate-flashcards")
async def generate_flashcards(request: FlashcardRequest):
    try:
        if not request.text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        # Create prompt based on mode
        if request.mode == "Translate":
            prompt = f"Create 5 flashcards from the following text, with the front being a term or concept in the original language, and the back being the translation or explanation. Format your response as a JSON array with 'front' and 'back' properties for each flashcard: {request.text}"
        elif request.mode == "Summarize":
            prompt = f"Create 5 flashcards from the following text, with the front being a key concept or topic, and the back being a concise summary or explanation. Format your response as a JSON array with 'front' and 'back' properties for each flashcard: {request.text}"
        elif request.mode == "Quiz":
            prompt = f"Create 5 quiz-style flashcards from the following text, with the front being a question about the content, and the back being the answer. Format your response as a JSON array with 'front' and 'back' properties for each flashcard: {request.text}"
        else:
            prompt = f"Create 5 flashcards from the following text, with the front being a key term or concept, and the back being a definition or explanation. Format your response as a JSON array with 'front' and 'back' properties for each flashcard: {request.text}"
        
        logger.info(f"Generating flashcards with mode: {request.mode}")
        
        # Use Gemini for flashcard generation
        try:
            response_text = query_gemini_model(prompt, max_tokens=1000, temperature=0.7)
            
            if isinstance(response_text, dict) and "error" in response_text:
                raise HTTPException(status_code=500, detail=response_text["error"])
            
            # Try to extract JSON from the response
            try:
                json_match = re.search(r'\[[\s\S]*\]', response_text)
                if json_match:
                    json_string = json_match.group(0)
                    flashcards = json.loads(json_string)
                else:
                    # If no JSON array found, try to parse the entire response as JSON
                    flashcards = json.loads(response_text)
            except Exception as e:
                logger.error(f"Error parsing JSON from Gemini response: {str(e)}")
                # Create fallback flashcards
                flashcards = None
                
        except Exception as e:
            logger.error(f"Error with Gemini: {str(e)}")
            flashcards = None
        
        # If we couldn't get proper JSON, create our own flashcards
        if not flashcards:
            # Create simple flashcards based on the text
            text_chunks = request.text.split('.')
            flashcards = []
            
            # Take up to 5 sentences and create flashcards
            for i, chunk in enumerate(text_chunks[:5]):
                if len(chunk.strip()) > 10:  # Only use non-empty chunks
                    if request.mode == "Quiz":
                        flashcards.append({
                            "front": f"Question {i+1}: What is described by '{chunk.strip()}'?",
                            "back": chunk.strip()
                        })
                    elif request.mode == "Translate":
                        flashcards.append({
                            "front": chunk.strip(),
                            "back": f"Translation of '{chunk.strip()}'"
                        })
                    else:
                        flashcards.append({
                            "front": f"Concept {i+1}",
                            "back": chunk.strip()
                        })
            
            # If we still don't have flashcards, create a fallback
            if not flashcards:
                flashcards = [
                    {"front": "Term 1", "back": "Definition 1"},
                    {"front": "Term 2", "back": "Definition 2"},
                    {"front": "Term 3", "back": "Definition 3"},
                    {"front": "Term 4", "back": "Definition 4"},
                    {"front": "Term 5", "back": "Definition 5"}
                ]
        
        return {"flashcards": flashcards}
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in flashcard generator: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating flashcards: {str(e)}")
