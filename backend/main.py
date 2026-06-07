from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
from typing import Dict, Any, Optional

from services.parser import extract_text_from_pdf
from services.llm_service import generate_flashcards, generate_exercises, generate_test, generate_diagram

app = FastAPI(title="Intellecta API", description="API for educational material generation")

# Allow CORS for local development and eventual frontend deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory volatile state management
# Structure: { session_id: {"text": extracted_text, "metadata": {...}} }
memory_state: Dict[str, Dict[str, Any]] = {}

class SessionRequest(BaseModel):
    session_id: str

class DiagramRequest(BaseModel):
    session_id: str
    diagram_type: str # 'processes', 'comparisons', 'hierarchies'

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Intellecta API is running."}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        content = await file.read()
        extracted_text = extract_text_from_pdf(content)
        
        if not extracted_text or len(extracted_text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")
        
        session_id = str(uuid.uuid4())
        memory_state[session_id] = {
            "text": extracted_text,
            "filename": file.filename
        }
        
        return {
            "session_id": session_id,
            "message": "PDF uploaded and parsed successfully.",
            "preview": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/flashcards")
async def api_generate_flashcards(req: SessionRequest):
    if req.session_id not in memory_state:
        raise HTTPException(status_code=404, detail="Session not found or expired.")
    text = memory_state[req.session_id]["text"]
    result = await generate_flashcards(text)
    return {"data": result}

@app.post("/generate/exercises")
async def api_generate_exercises(req: SessionRequest):
    if req.session_id not in memory_state:
        raise HTTPException(status_code=404, detail="Session not found or expired.")
    text = memory_state[req.session_id]["text"]
    result = await generate_exercises(text)
    return {"data": result}

@app.post("/generate/test")
async def api_generate_test(req: SessionRequest):
    if req.session_id not in memory_state:
        raise HTTPException(status_code=404, detail="Session not found or expired.")
    text = memory_state[req.session_id]["text"]
    result = await generate_test(text)
    return {"data": result}

@app.post("/generate/diagram")
async def api_generate_diagram(req: DiagramRequest):
    if req.session_id not in memory_state:
        raise HTTPException(status_code=404, detail="Session not found or expired.")
    text = memory_state[req.session_id]["text"]
    result = await generate_diagram(text, req.diagram_type)
    return {"data": result}
