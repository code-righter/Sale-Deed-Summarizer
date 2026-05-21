from fastapi import APIRouter, HTTPException
from bson import ObjectId

from app.db import documents_collection

router = APIRouter(
    prefix="/history",
    tags=["History"]
)


# =========================================================
# GET ALL DOCUMENTS
# FOR SIDEBAR HISTORY
# =========================================================

@router.get("/documents")
async def get_all_documents():

    try:

        documents = await (
            documents_collection.find(

                {},

                {
                    "_id": 0,

                    "document_id": 1,

                    "document_name": 1,

                    "uploaded_at": 1,

                    "processing_status": 1
                }

            )

            .sort("uploaded_at", -1)

            .to_list(length=100)
        )

        formatted_documents = []

        for doc in documents:

            formatted_documents.append({

                "document_id":
                doc.get("document_id"),

                "document_name":
                doc.get(
                    "document_name",
                    "Unknown Document"
                ),

                "uploaded_at":
                doc.get("uploaded_at"),

                "processing_status":
                doc.get(
                    "processing_status",
                    "unknown"
                )
            })

        return {

            "success": True,

            "count":
            len(formatted_documents),

            "documents":
            formatted_documents
        }

    except Exception as e:

        raise HTTPException(

            status_code=500,

            detail=str(e)
        )
# =========================================================
# GET SINGLE DOCUMENT
# FULL REPORT DATA
# =========================================================

@router.get("/documents/{document_id}")
async def get_document_by_id(
    document_id: str
):

    try:

        print(
            "Fetching document from MongoDB"
        )

        document = await documents_collection.find_one(
            {
                "document_id": document_id
            }
        )

        if not document:

            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )

        # Convert Mongo ObjectId safely
        document["_id"] = str(
            document["_id"]
        )

        print(
            "Document fetch complete"
        )

        return {

            "success": True,

            "document": document
        }

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )