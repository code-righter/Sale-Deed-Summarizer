# app/services/qwen_extraction_service.py

import requests


# ===================================================
# VM ENDPOINTS
# ===================================================

VM_EXTRACTION_API = "http://34.118.113.47:8000/extract"

VM_QA_API = "http://34.118.113.47:8000/ask"


# ===================================================
# 1. SUMMARY / STRUCTURED EXTRACTION
# ===================================================

def extract_sale_deed_data(document_text):

    try:

        response = requests.post(

            VM_EXTRACTION_API,

            json={
                "document_text": document_text
            },

            timeout=300
        )

        return response.json()

    except Exception as e:

        return {

            "success": False,

            "error": str(e)
        }


# ===================================================
# 2. RAG QUESTION ANSWERING
# ===================================================

def ask_qwen_question(prompt):

    try:

        response = requests.post(

            VM_QA_API,

            json={
                "prompt": prompt
            },

            timeout=300
        )

        return response.json()

    except Exception as e:

        return {

            "success": False,

            "error": str(e)
        }