from fastapi import (
    APIRouter,
    HTTPException
)

from app.db import documents_collection


router = APIRouter()


# =========================================================
# GET FINAL REPORT
# =========================================================

@router.get("/report/{document_id}")
async def get_final_report(
    document_id: str
):

    try:
        print("Document Report Req")
        document = await documents_collection.find_one(
            {
                "document_id": document_id
            },
            {
                "_id": 0
            }
        )

        if not document:

            raise HTTPException(
                status_code=404,
                detail="Report not found"
            )

        return {

            "success": True,

            "report": document
        }

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )