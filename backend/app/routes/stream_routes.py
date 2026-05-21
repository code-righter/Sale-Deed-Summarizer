from fastapi import (
    APIRouter,
    HTTPException
)

from fastapi.responses import (
    StreamingResponse
)

import asyncio
import json

from app.state.job_state_manager import (
    get_job_state
)


router = APIRouter()


# =========================================================
# SSE EVENT GENERATOR
# =========================================================

async def event_generator(
    document_id: str
):

    previous_state = None

    while True:

        state = get_job_state(
            document_id
        )

        if not state:

            await asyncio.sleep(1)

            continue


        # =============================================
        # SEND ONLY WHEN STATE CHANGES
        # =============================================

        if state != previous_state:

            yield (

                f"data: "
                f"{json.dumps(state)}\n\n"
            )

            previous_state = state


        # =============================================
        # STOP WHEN FINISHED
        # =============================================

        if state["status"] in [
            "completed",
            "failed"
        ]:

            break


        await asyncio.sleep(0.5)


# =========================================================
# STREAM ROUTE
# =========================================================

@router.get("/stream/{document_id}")
async def stream_document_status(
    document_id: str
):

    state = get_job_state(
        document_id
    )

    if not state:

        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    return StreamingResponse(

        event_generator(document_id),

        media_type="text/event-stream",

        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )