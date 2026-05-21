from app.db import documents_collection


async def update_processing_status(
    document_id: str,
    current_step: str,
    progress_percentage: int,
    step_message: str,
    processing_status: str = "processing",
    error: str = None
):

    await documents_collection.update_one(
        {
            "document_id": document_id
        },
        {
            "$set": {
                "processing_status": processing_status,
                "current_step": current_step,
                "progress_percentage": progress_percentage,
                "step_message": step_message,
                "error": error
            }
        }
    )