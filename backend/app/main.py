from fastapi import FastAPI

from app.db import client
from fastapi.middleware.cors import CORSMiddleware

from app.routes.upload_routes import (
    router as upload_router
)

from app.routes.stream_routes import (
    router as stream_router
)

from app.routes.report_routes import (
    router as report_router
)
from app.routes.history_routes import (
    router as history_router
)



app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# ROUTERS
# =========================================================

app.include_router(
    upload_router,
    prefix="/api"
)

app.include_router(
    stream_router,
    prefix="/api"
)

app.include_router(
    report_router,
    prefix="/api"
)
app.include_router(
    history_router,
    prefix="/api"
)



# =========================================================
# ROOT ROUTE
# =========================================================

@app.get("/")
def root():

    return {
        "message": "Sale Deed Backend Running"
    }