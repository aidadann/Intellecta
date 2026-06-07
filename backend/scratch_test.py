import asyncio
import os
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv(dotenv_path='d:/Project/Intellecta/backend/.env')
client = genai.Client()

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

async def test_gen():
    prompt = "Create a practice test about Photosynthesis. Provide exactly 1 multiple choice, 1 true/false, and 1 short answer."
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=TestModel,
            ),
        )
        print("SUCCESS:", response.text)
    except Exception as e:
        print("ERROR:", str(e))

asyncio.run(test_gen())
