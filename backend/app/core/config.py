from dotenv import load_dotenv

import os


load_dotenv()


class Settings:

    REDIS_URL = os.getenv(
        "REDIS_URL"
    )

    MONGO_URL = os.getenv(
        "MONGO_URL"
    )

    CELERY_BROKER_URL = REDIS_URL

    CELERY_RESULT_BACKEND = REDIS_URL

    UPLOAD_FOLDER = "uploads"

    GOOGLE_CLIENT_ID = os.getenv(
    "GOOGLE_CLIENT_ID"
)

    GOOGLE_CLIENT_SECRET = os.getenv(
        "GOOGLE_CLIENT_SECRET"
    )

    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY"
    )

    FRONTEND_URL_1 = os.getenv(
        "FRONTEND_URL_1"
    )

    FRONTEND_URL_2 = os.getenv(
        "FRONTEND_URL_2"
    )


settings = Settings()