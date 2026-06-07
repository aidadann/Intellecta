import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# Ensure you have GEMINI_API_KEY set in your environment variables (.env file)
# The client automatically picks it up
try:
    client = genai.Client()
except Exception as e:
    print(f"Failed to initialize GenAI client. Ensure GEMINI_API_KEY is set. Error: {e}")
    client = None

MODEL_ID = 'gemini-2.5-flash' # Good balance of speed and reasoning

async def _call_llm_json(prompt: str) -> dict:
    if not client:
        return {"error": "LLM Client not initialized. Check API Key."}
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        return {"error": str(e)}

async def _call_llm_text(prompt: str) -> str:
    if not client:
        return "LLM Client not initialized. Check API Key."
    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
        )
        return response.text
    except Exception as e:
        return f"Error generating text: {str(e)}"

async def generate_flashcards(text: str) -> dict:
    prompt = f"""
    Analyze the following text and extract key terms and definitions for spaced-repetition study.
    Return a JSON object with a single key "flashcards" containing a list of objects, each with "term" and "definition".
    Limit to top 15 most important concepts.

    TEXT:
    {text}
    """
    return await _call_llm_json(prompt)

async def generate_exercises(text: str) -> dict:
    prompt = f"""
    Analyze the following text and create a series of interactive, short-form practice problems based on the core concepts.
    Return a JSON object with a key "exercises" containing a list of objects.
    Each object should have:
    - "question": The practice problem.
    - "hint": A small hint.
    - "answer": The correct answer or explanation.

    Limit to 5-7 exercises.

    TEXT:
    {text}
    """
    return await _call_llm_json(prompt)

async def generate_test(text: str) -> dict:
    prompt = f"""
    Compile a formal practice test from the following text.
    Return a JSON object with three keys: "multiple_choice", "true_false", and "short_answer".
    Each should be a list of questions with their respective answer keys.

    For "multiple_choice": include "question", "options" (list of strings), and "correct_answer".
    For "true_false": include "question" and "correct_answer" (boolean).
    For "short_answer": include "question" and "correct_answer_guide".

    Provide 3 questions of each type.

    TEXT:
    {text}
    """
    return await _call_llm_json(prompt)

async def generate_diagram(text: str, diagram_type: str) -> dict:
    instructions = ""
    if diagram_type == "processes":
        instructions = "Use Mermaid.js `graph TD` to show the steps of a cycle or system."
    elif diagram_type == "comparisons":
        instructions = "Use Mermaid.js `quadrantChart` to show overlaps or differences between competing theories/concepts."
    elif diagram_type == "hierarchies":
        instructions = "Use Mermaid.js `mindmap` to break down complex chapters into sub-topics."
    else:
        instructions = "Use a Mermaid.js `graph TD` flowchart."

    prompt = f"""
    You are an expert at creating visual mnemonics using Mermaid.js.
    Based on the following text, identify a core concept that fits the requested diagram type: {diagram_type}.
    
    {instructions}

    Return a JSON object with:
    - "title": A short title for the diagram.
    - "description": A brief explanation of what the diagram shows.
    - "mermaid_code": The raw Mermaid.js syntax (do NOT wrap in markdown code blocks like ```mermaid, just the code itself).
    
    TEXT:
    {text}
    """
    return await _call_llm_json(prompt)
