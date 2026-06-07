# Intellecta

> Because reading a 40-page unformatted PDF is a crime against humanity. 

**Intellecta** is a full-stack, AI-powered educational platform that swallows your dry, boring PDF documents and spits out highly structured, interactive study materials. Built with React, FastAPI, and Google's Gemini 2.5 Flash, it essentially acts as your personal, highly-caffeinated teaching assistant.

---

## Features

-  **Smart PDF Ingestion**: Upload a PDF and watch as it gets stripped of formatting and chunked into digestible pieces. No more token-limit bankruptcies!
-  **Spaced-Repetition Flashcards**: Automatically extracts the top concepts and definitions so you can pretend you read the whole chapter.
-  **Interactive Exercises**: Short-form practice problems with hidden hints and answers.
-  **Formal Practice Tests**: Generates Multiple Choice, True/False, and Short Answer questions. Perfect for inducing mild academic panic.
-  **Visual Diagrams (Mermaid.js)**: Automatically maps concepts into Flowcharts, Block Diagrams, ERDs, and Hierarchy mindmaps because some of us are *visual learners*.
-  **"Generate More" Infinite Loop**: Intelligently paginates through your PDF chunks to generate *new* questions without repeating the old ones (or at least, that's the plan until the AI begs for mercy via a `429 Resource Exhausted` error).

---

## Tech Stack

### Frontend (The Pretty Face)
- **React & Vite**: Because waiting for Webpack to compile is so 2018.
- **Tailwind CSS v4**: Beautiful, custom glassmorphism design with dark mode, because if you're going to study at 3 AM, you shouldn't burn your retinas.
- **Framer Motion**: Smooth, buttery micro-animations that make you feel like you're using software from the future.
- **Mermaid.js**: Dynamically turning AI-generated text strings into beautiful SVG architecture diagrams.

### Backend (The Brains)
- **FastAPI**: It's fast. It's an API. It does what it says on the tin.
- **Python**: Managing the heavy lifting.
- **PyMuPDF**: For ruthlessly extracting text from PDFs with extreme prejudice.
- **Google GenAI SDK (Gemini-2.5-Flash)**: The LLM engine under the hood. We enforce strict **Pydantic Schemas** so the AI doesn't go rogue and return a poem instead of JSON.

---

## How to Run Locally

Want to spin this up on your own machine? Awesome. Just don't forget your API key, or the app will judge you silently.

### 1. Clone & Setup the Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

Create a `.env` file in the `backend` folder and toss in your Google AI Studio key:
```env
GEMINI_API_KEY=AIzaSyYourSecretKeyGoesHereAndPleaseDontCommitIt
```

Start the engines:
```bash
uvicorn main:app --reload --port 8000
```

### 2. Setup the Frontend

Open a new terminal window:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` folder (if you want to point to a deployed backend):
```env
VITE_API_URL=http://localhost:8000
```

Fire it up:
```bash
npm run dev
```

---

## Known Quirks & Disclaimers
- **The "Resource Exhausted" Wall**: Gemini's free tier allows 15 requests per minute. If you aggressively spam the "Generate More" button like you're playing Cookie Clicker, the AI will put you in timeout for a minute. Go grab a coffee.
- **Render Cold Starts**: If you deploy the backend on Render's free tier, it takes a 15-minute nap when nobody is looking. The first PDF upload might take 2 minutes while the server wakes up, yawns, and stretches.

---
*Built with ❤️ (and entirely too much caffeine) for students everywhere.*
