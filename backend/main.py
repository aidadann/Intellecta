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
    chunk_index: int = 0

class DiagramRequest(BaseModel):
    session_id: str
    diagram_type: str
    chunk_index: int = 0 # 'processes', 'comparisons', 'hierarchies'

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Intellecta API is running."}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        pdf_bytes = await file.read()
        chunks = extract_text_from_pdf(pdf_bytes, pages_per_chunk=2)
        
        if not chunks:
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")
        
        session_id = str(uuid.uuid4())
        
        # Store the list of chunks instead of a single massive string
        memory_state[session_id] = {
            "chunks": chunks,
            "total_chunks": len(chunks)
        }
        
        return {
            "session_id": session_id,
            "message": "PDF uploaded and parsed successfully.",
            "preview": chunks[0][:500] + "..." if len(chunks[0]) > 500 else chunks[0],
            "total_chunks": len(chunks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/flashcards")
async def api_generate_flashcards(req: SessionRequest):
    if req.session_id not in memory_state:
        raise HTTPException(status_code=404, detail="Session not found or expired.")
    chunks = memory_state[req.session_id]["chunks"]
    if req.chunk_index >= len(chunks):
        return {"data": {"error": "End of document reached."}}
    
    result = await generate_flashcards(chunks[req.chunk_index])
    return {"data": result}

@app.post("/generate/exercises")
async def api_generate_exercises(req: SessionRequest):
    if req.session_id not in memory_state:
        raise HTTPException(status_code=404, detail="Session not found or expired.")
    chunks = memory_state[req.session_id]["chunks"]
    if req.chunk_index >= len(chunks):
        return {"data": {"error": "End of document reached."}}
        
    result = await generate_exercises(chunks[req.chunk_index])
    return {"data": result}

@app.post("/generate/test")
async def api_generate_test(req: SessionRequest):
    if req.session_id not in memory_state:
        raise HTTPException(status_code=404, detail="Session not found or expired.")
    chunks = memory_state[req.session_id]["chunks"]
    if req.chunk_index >= len(chunks):
        return {"data": {"error": "End of document reached."}}
        
    result = await generate_test(chunks[req.chunk_index])
    return {"data": result}

@app.post("/generate/diagram")
async def api_generate_diagram(req: DiagramRequest):
    if req.session_id not in memory_state:
        raise HTTPException(status_code=404, detail="Session not found or expired.")
    chunks = memory_state[req.session_id]["chunks"]
    
    # Diagrams can just use chunk 0 by default, or specific chunks if requested
    chunk_idx = min(req.chunk_index, len(chunks) - 1)
    
    result = await generate_diagram(chunks[chunk_idx], req.diagram_type)
    return {"data": result}
