import logging
from datetime import datetime

from app.db import documents_collection

from app.state.job_state_manager import (
    set_job_state
)

from app.services.pdf_service import pdf_to_images
from app.services.ocr_service import run_ocr
from app.services.translation_service import translate_text
from app.services.text_cleaning import normalize_text
from app.services.stamp_detection_service import detect_stamp_pages
from app.services.qwen_extraction_service import extract_sale_deed_data
from app.services.prompt_service import build_extraction_prompt


logger = logging.getLogger(__name__)


def process_sale_deed_pipeline(
    document_id: str,
    pdf_path: str,
    original_filename: str
):

    step = "initializing"

    try:

        # =================================================
        # STEP 1 — PDF TO IMAGES
        # =================================================

        step = "pdf_to_images"

        set_job_state(
            job_id=document_id,
            status="processing",
            step=step,
            progress=10,
            message="Converting PDF into images"
        )

        image_paths = pdf_to_images(pdf_path)

        if not image_paths:
            raise Exception("No images generated from PDF")


        # =================================================
        # STEP 2 — OCR
        # =================================================

        step = "ocr_processing"

        set_job_state(
            job_id=document_id,
            status="processing",
            step=step,
            progress=30,
            message="Running OCR and translation"
        )

        processed_pages = []

        for idx, image_path in enumerate(image_paths):

            raw_text = run_ocr(image_path)

            cleaned_text = normalize_text(raw_text)

            translated_text = translate_text(
                cleaned_text
            )

            processed_pages.append({
                "page_number": idx + 1,
                "translated_text": translated_text
            })


        # =================================================
        # STEP 3 — STAMP DETECTION
        # =================================================

        step = "stamp_detection"

        set_job_state(
            job_id=document_id,
            status="processing",
            step=step,
            progress=50,
            message="Detecting stamp pages  "
        )

        stamp_pages = detect_stamp_pages(
            processed_pages
        )

        if not stamp_pages:
            stamp_pages = processed_pages


        # =================================================
        # STEP 4 — BUILD DOCUMENT
        # =================================================

        step = "document_build"

        set_job_state(
            job_id=document_id,
            status="processing",
            step=step,
            progress=70,
            message="Preparing document context"
        )

        complete_document_text = ""

        for page in stamp_pages:

            complete_document_text += (
                f"\n\n--- PAGE "
                f"{page['page_number']} ---\n\n"
                f"{page['translated_text']}"
            )


        # =================================================
        # STEP 5 — PROMPT BUILD
        # =================================================

        step = "prompt_build"

        set_job_state(
            job_id=document_id,
            status="processing",
            step=step,
            progress=80,
            message="Constructing extraction prompt"
        )

        final_prompt = build_extraction_prompt(
            complete_document_text
        )


        # =================================================
        # STEP 6 — LLM EXTRACTION
        # =================================================

        step = "llm_extraction"

        set_job_state(
            job_id=document_id,
            status="processing",
            step=step,
            progress=90,
            message="Extracting legal entities"
        )

        extraction_response = extract_sale_deed_data(
            final_prompt
        )


        # =================================================
        # STEP 7 — FINAL SAVE
        # =================================================

        step = "completed"

        awaitable = documents_collection.insert_one({
            "document_id": document_id,
            "document_name": original_filename,
            "uploaded_at": datetime.utcnow(),
            "processing_status": "completed",
            "total_pages": len(processed_pages),
            "stamp_pages_detected": len(stamp_pages),
            "document_character_count": len(
                complete_document_text
            ),
            "llm_output": extraction_response
        })

        # Handle Motor async object safely
        try:
            import asyncio
            asyncio.run(awaitable)
        except:
            pass


        set_job_state(
            job_id=document_id,
            status="completed",
            step="completed",
            progress=100,
            message="Document processed successfully",
            data={
                "document_id": document_id
            }
        )

        logger.info(
            f"[{document_id}] "
            f"Processing completed"
        )

    except Exception as e:

        logger.error(
            f"[{document_id}] "
            f"Failed at step '{step}' "
            f": {str(e)}",
            exc_info=True
        )

        set_job_state(
            job_id=document_id,
            status="failed",
            step=step,
            progress=0,
            message=str(e)
        )