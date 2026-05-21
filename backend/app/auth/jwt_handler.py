import jwt

from datetime import (
    datetime,
    timedelta
)

from app.core.config import settings


ALGORITHM = "HS256"


def create_access_token(
    data: dict
):

    payload = data.copy()

    payload["exp"] = (
        datetime.utcnow() +
        timedelta(days=7)
    )

    token = jwt.encode(

        payload,

        settings.JWT_SECRET_KEY,

        algorithm=ALGORITHM
    )

    return token


def verify_token(
    token: str
):

    try:

        payload = jwt.decode(

            token,

            settings.JWT_SECRET_KEY,

            algorithms=[ALGORITHM]
        )

        return payload

    except Exception:

        return None