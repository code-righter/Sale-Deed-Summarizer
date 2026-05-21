from fastapi import FastAPI
from pydantic import BaseModel

import requests
import json

app = FastAPI()

OLLAMA_URL = "http://localhost:11434/api/generate"


# ===================================================
# REQUEST MODELS
# ===================================================

class ExtractionRequest(BaseModel):

    document_text: str


class QuestionRequest(BaseModel):

    prompt: str


# ===================================================
# 1. SUMMARY EXTRACTION ROUTE
# ===================================================

@app.post("/extract")

async def extract_sale_deed(
    data: ExtractionRequest
):

    prompt = f"""
You are a legal sale deed extraction system.

Carefully analyze the provided sale deed document.

Extract ONLY:

1. vendor_names
2. purchaser_names
3. ownership_history_names
4. property_location
5. sale_amount

Rules:
- Return ONLY valid JSON
- Do not explain anything
- Do not add markdown
- Preserve names exactly
- If field missing return empty string

Required JSON format:

{{
  "vendor_names": [],
  "purchaser_names": [],
  "ownership_history_names": [],
  "property_location": "",
  "sale_amount": ""
}}

Document:

{data.document_text}
"""

    response = requests.post(

        OLLAMA_URL,

        json={

            "model":
                "qwen2.5:14b-instruct-q4_K_M",

            "prompt":
                prompt,

            "stream":
                False,

            "options": {

                "temperature": 0,

                "num_ctx": 8192
            }
        }
    )

    result = response.json()

    raw_output = result["response"].strip()

    # remove markdown wrappers
    raw_output = raw_output.replace(
        "```json",
        ""
    )

    raw_output = raw_output.replace(
        "```",
        ""
    )

    raw_output = raw_output.strip()

    try:

        parsed_json = json.loads(
            raw_output
        )

        return {

            "success": True,

            "data": parsed_json
        }

    except Exception:

        return {

            "success": False,

            "raw_output": raw_output
        }


# ===================================================
# 2. RAG QUESTION ANSWERING ROUTE
# ===================================================

@app.post("/ask")

async def ask_question(
    data: QuestionRequest
):

    response = requests.post(

        OLLAMA_URL,

        json={

            "model":
                "qwen2.5:14b-instruct-q4_K_M",

            "prompt":
                data.prompt,

            "stream":
                False,

            "options": {

                "temperature": 0.2,

                "num_ctx": 4096
            }
        }
    )

    result = response.json()

    answer = result["response"].strip()

    return {

        "success": True,

        "answer": answer
    }
