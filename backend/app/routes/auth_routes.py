from fastapi import (
    APIRouter,
    Request
)

from fastapi.responses import (
    RedirectResponse
)

from datetime import datetime

from app.auth.google_oauth import (
    oauth
)

from app.auth.jwt_handler import (
    create_access_token
)

from app.db import users_collection

from app.core.config import settings


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =========================================================
# LOGIN
# =========================================================

@router.get("/login")
async def login(request: Request):

    redirect_uri = (
        "http://localhost:8000"
        "/api/auth/callback"
    )

    return await oauth.google.authorize_redirect(
        request,
        redirect_uri
    )


# =========================================================
# CALLBACK
# =========================================================

@router.get("/callback")
async def auth_callback(
    request: Request
):

    token = await oauth.google.authorize_access_token(
        request
    )

    user_info = token.get("userinfo")

    email = user_info["email"]

    existing_user = await users_collection.find_one(
        {
            "email": email
        }
    )

    if not existing_user:

        await users_collection.insert_one({

            "google_id":
            user_info["sub"],

            "email":
            email,

            "name":
            user_info["name"],

            "picture":
            user_info.get("picture"),

            "created_at":
            datetime.utcnow()
        })


    jwt_token = create_access_token({

        "email": email,

        "name": user_info["name"]
    })


    frontend_redirect = (
        f"{settings.FRONTEND_URL}"
        f"/auth/success?"
        f"token={jwt_token}"
    )

    return RedirectResponse(
        frontend_redirect
    )