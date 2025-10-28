# generator.py
import os, json, time
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except Exception:
    genai = None
    HAS_GEMINI = False

GEMINI_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_KEY and HAS_GEMINI:
    genai.configure(api_key=GEMINI_KEY)

def load_template(path: str) -> str:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Template not found: {path}")
    return p.read_text(encoding='utf-8')

def fill_template(template_str: str, variables: dict) -> str:
    return template_str.format(**variables)

def call_gemini_generate(prompt: str, model_name="gemini-2.5-flash", temperature=0.7, max_output_tokens=800, max_retries=1, debug=False):
    if not HAS_GEMINI or not GEMINI_KEY:
        raise RuntimeError("Gemini SDK or GEMINI_API_KEY missing. Install google-generativeai and set GEMINI_API_KEY.")

    os.makedirs("generated_content", exist_ok=True)
    attempt = 0
    current_max = max_output_tokens
    while True:
        attempt += 1
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(
            prompt,
            generation_config={"temperature": temperature, "max_output_tokens": current_max}
        )
        ts = time.strftime("%Y%m%d_%H%M%S")
        raw_path = f"generated_content/raw_response_{ts}_attempt{attempt}.json"
        try:
            with open(raw_path, "w", encoding="utf-8") as fh:
                try:
                    json.dump(response.__dict__, fh, default=str, indent=2)
                except Exception:
                    fh.write(repr(response))
        except Exception:
            raw_path = None

        try:
            if hasattr(response, "text") and response.text:
                return {"text": response.text.strip(), "raw_path": raw_path}
        except Exception:
            pass

        candidates = getattr(response, "candidates", None)
        pieces = []
        if candidates:
            for cand in candidates:
                txt = getattr(cand, "content", None) or getattr(cand, "text", None)
                if isinstance(txt, str) and txt.strip():
                    pieces.append(txt.strip())
                    continue
                out = getattr(cand, "output", None) or getattr(cand, "message", None)
                if out:
                    try:
                        if isinstance(out, (list, tuple)) and len(out) > 0:
                            first = out[0]
                            if isinstance(first, dict):
                                cont = first.get("content")
                                if isinstance(cont, (list, tuple)) and len(cont) > 0:
                                    maybe = cont[0].get("text") or cont[0].get("content")
                                    if maybe:
                                        pieces.append(str(maybe).strip())
                                        continue
                            maybe = getattr(first, "content", None) or getattr(first, "text", None)
                            if isinstance(maybe, str) and maybe.strip():
                                pieces.append(maybe.strip())
                                continue
                    except Exception:
                        pass
                try:
                    pieces.append(str(cand))
                except Exception:
                    pass

        if pieces:
            finish_reasons = [getattr(c, "finish_reason", None) for c in candidates] if candidates else []
            truncated = any(fr in (None, "", "length", "max_tokens") or (isinstance(fr, int) and fr == 2) for fr in finish_reasons)
            result_text = "\n\n".join(pieces).strip()
            if truncated and attempt <= max_retries:
                current_max = min(current_max * 2, 3000)
                continue
            return {"text": result_text, "raw_path": raw_path}

        return {"text": str(response), "raw_path": raw_path}

def generate_from_payload(payload: dict) -> dict:
    assistant = payload.get("assistant", "Zeus")
    template_path = payload.get("template") or "templates/blog_outline.txt"
    brand_type = payload.get("brand_type") or "Generic Brand"
    topic = payload.get("topic")
    audience = payload.get("audience") or "general audience"
    tone = payload.get("tone") or "professional"
    system_json = payload.get("system_json")
    model = payload.get("model") or "gemini-2.5-flash"
    temperature = float(payload.get("temperature", 0.7))
    max_tokens = int(payload.get("max_tokens", 800))

    template_str = load_template(template_path)
    variables = {
        "assistant_name": assistant,
        "brand_type": brand_type,
        "topic": topic,
        "target_audience": audience,
        "tone": tone
    }
    user_prompt = fill_template(template_str, variables)

    system_message = None
    if system_json:
        p = Path(system_json)
        if p.exists():
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
                system_message = data.get("instructions")
            except Exception:
                system_message = None

    if system_message:
        full_prompt = f"[SYSTEM INSTRUCTIONS]\n{system_message}\n\n[USER TASK]\n{user_prompt}"
    else:
        full_prompt = user_prompt

    result = call_gemini_generate(full_prompt, model_name=model, temperature=temperature, max_output_tokens=max_tokens, max_retries=1, debug=False)
    return result
