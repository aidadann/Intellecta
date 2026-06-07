import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import List

load_dotenv()

try:
    client = genai.Client()
except Exception as e:
    print(f"Failed to initialize GenAI client. Ensure GEMINI_API_KEY is set. Error: {e}")
    client = None

MODEL_ID = 'gemini-2.5-flash'

# Pydantic Schemas for Strict JSON enforcement
class Flashcard(BaseModel):
    term: str
    definition: str

class FlashcardList(BaseModel):
    flashcards: list[Flashcard]

class Exercise(BaseModel):
    question: str
    hint: str
    answer: str

class ExerciseList(BaseModel):
    exercises: list[Exercise]

class MCQ(BaseModel):
    question: str
    options: list[str]
    correct_answer: str

class TF(BaseModel):
    question: str
    correct_answer: bool

class SA(BaseModel):
    question: str
    correct_answer_guide: str

class TestModel(BaseModel):
    multiple_choice: list[MCQ]
    true_false: list[TF]
    short_answer: list[SA]

class DiagramModel(BaseModel):
    title: str
    description: str
    mermaid_code: str

async def _call_llm_json(prompt: str, schema) -> dict:
    if not client:
        return {"error": "LLM Client not initialized. Check API Key."}
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema,
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"LLM Error: {str(e)}")
        return {"error": str(e)}

async def generate_flashcards(text: str) -> dict:
    prompt = f"""
    Analyze the following text and extract key terms and definitions for spaced-repetition study.
    Return the output strictly matching the required schema. Limit to top 15 most important concepts.

    TEXT:
    {text}
    """
    return await _call_llm_json(prompt, FlashcardList)

async def generate_exercises(text: str) -> dict:
    prompt = f"""
    Analyze the following text and create a series of interactive, short-form practice problems based on the core concepts.
    Limit to 5-7 exercises.

    TEXT:
    {text}
    """
    return await _call_llm_json(prompt, ExerciseList)

async def generate_test(text: str) -> dict:
    prompt = f"""
    Compile a formal practice test from the following text.
    Provide exactly 3 multiple choice questions, 3 true/false questions, and 3 short answer questions.

    TEXT:
    {text}
    """
    return await _call_llm_json(prompt, TestModel)

async def generate_diagram(text: str, diagram_type: str) -> dict:
    instructions = ""
    if diagram_type == "processes":
        instructions = "Use Mermaid.js `graph TD` to show the steps of a cycle or system."
    elif diagram_type == "comparisons":
        instructions = "Use Mermaid.js `quadrantChart` to show overlaps or differences between competing theories/concepts."
    elif diagram_type == "hierarchies":
        instructions = "Use Mermaid.js `mindmap` to break down complex chapters into sub-topics."
    elif diagram_type == "flowchart":
        instructions = "Use Mermaid.js `graph LR` or `graph TD` to create a logical flowchart of decisions or steps."
    elif diagram_type == "block_diagram":
        instructions = "Use Mermaid.js `block-beta` to create a block diagram showing system components and their relationships."
    elif diagram_type == "erd":
        instructions = "Use Mermaid.js `erDiagram` to show an Entity-Relationship Diagram of core concepts acting as entities."
    elif diagram_type == "venn":
        instructions = "Mermaid doesn't have native Venn diagrams. Instead, use `quadrantChart` or `graph` to creatively compare concepts and show their intersections or differences."
    elif diagram_type == "tree":
        instructions = "Use Mermaid.js `graph TD` to create a top-down tree structure representing categorization."
    else:
        instructions = "Use a basic Mermaid.js `graph TD` flowchart."

    prompt = f"""
    You are an expert at creating visual mnemonics using Mermaid.js.
    Based on the following text, identify a core concept that fits the requested diagram type: {diagram_type}.
    
    {instructions}

    Important: For `mermaid_code`, return the raw Mermaid.js syntax only. Do NOT wrap it in markdown code blocks (e.g. no ```mermaid).
    
    TEXT:
    {text}
    """
    return await _call_llm_json(prompt, DiagramModel)
