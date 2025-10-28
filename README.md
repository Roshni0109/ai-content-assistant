AI Content Assistant — Full Vite + FastAPI Project

Structure:
- backend/  (FastAPI + generator module)
- frontend/ (Vite + React + TypeScript UI)

Setup Backend:
1. cd backend
2. python -m venv venv
3. source venv/bin/activate   (or source venv/bin/activate  on Windows)
4. pip install -r requirements.txt
5. copy .env.template to .env and add GEMINI_API_KEY=your_key
6. uvicorn app:app --reload --port 8000

Setup Frontend:
1. cd frontend
2. npm install
3. npm run dev

The frontend is proxied to backend /api -> http://localhost:8000 via vite.config.ts

Notes:
- This project uses google-generativeai SDK (Gemini). Ensure your key has access to models.
- The frontend UI uses simple inline styles; Tailwind is not installed by default.
