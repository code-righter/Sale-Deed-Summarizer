from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException
)

import uuid
import os
import shutil
import logging

from datetime import datetime

from app.core.config import settings

from app.state.job_state_manager import (
    set_job_state,
    get_job_state
)

from app.workers.document_worker import (
    process_sale_deed_task
)

from app.db import documents_collection


logger = logging.getLogger(__name__)

router = APIRouter()

os.makedirs(
    settings.UPLOAD_FOLDER,
    exist_ok=True
)


# =========================================================
# SAVE PDF
# =========================================================

async def save_uploaded_file(
    file: UploadFile
) -> str:

    file_name = f"{uuid.uuid4()}.pdf"

    file_path = os.path.join(
        settings.UPLOAD_FOLDER,
        file_name
    )

    with open(file_path, "wb") as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    return file_path


# =========================================================
# UPLOAD DOCUMENT
# =========================================================

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...)
):

    try:

        # =============================================
        # VALIDATE FILE
        # =============================================

        if not file.filename:

            raise HTTPException(
                status_code=400,
                detail="Invalid file"
            )

        if not file.filename.lower().endswith(".pdf"):

            raise HTTPException(
                status_code=400,
                detail="Only PDF files are allowed"
            )


        # =============================================
        # CREATE DOCUMENT ID
        # =============================================

        document_id = str(uuid.uuid4())


        # =============================================
        # SAVE FILE
        # =============================================

        pdf_path = await save_uploaded_file(
            file
        )


        # =============================================
        # INITIAL REDIS STATE
        # =============================================

        set_job_state(
            job_id=document_id,
            status="queued",
            step="uploaded",
            progress=0,
            message="Document uploaded successfully"
        )



        # =============================================
        # ENQUEUE CELERY TASK
        # =============================================

        task = process_sale_deed_task.delay(

            document_id,

            pdf_path,

            file.filename
        )


        logger.info(
            f"[{document_id}] "
            f"Task queued successfully "
            f"Task ID: {task.id}"
        )


        # =============================================
        # RESPONSE
        # =============================================

        return {

            "success": True,

            "document_id": document_id,

            "task_id": task.id,

            "message": (
                "Document uploaded and "
                "queued for processing"
            )
        }

    except HTTPException:

        raise

    except Exception as e:

        logger.error(
            f"Upload failed: {str(e)}",
            exc_info=True
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================================================
# GET CURRENT JOB STATUS
# =========================================================

@router.get(
    "/processing-status/{document_id}"
)
async def get_processing_status(
    document_id: str
):

    try:

        state = get_job_state(
            document_id
        )

        if not state:

            raise HTTPException(
                status_code=404,
                detail=(
                    "Document status "
                    "not found"
                )
            )

        return {

            "success": True,

            "status": state,
        }

    except HTTPException:

        raise

    except Exception as e:

        logger.error(
            f"Status fetch failed: "
            f"{str(e)}",
            exc_info=True
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )