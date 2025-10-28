from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os, json
from generator import generate_from_payload
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title='AI Content Assistant API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173','http://localhost:3000'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

class GenerateRequest(BaseModel):
    assistant: str
    template: str | None = None
    brand_type: str | None = None
    topic: str
    audience: str | None = None
    tone: str | None = None
    system_json: str | None = None
    model: str | None = None
    temperature: float | None = 0.7
    max_tokens: int | None = 800

@app.post('/api/generate')
async def generate(req: GenerateRequest):
    payload = req.dict()
    if not payload.get('topic') or not payload.get('assistant'):
        raise HTTPException(status_code=400, detail='assistant and topic are required')
    try:
        result = generate_from_payload(payload)
        return {'output': result.get('text'), 'raw': result.get('raw_path', None)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
