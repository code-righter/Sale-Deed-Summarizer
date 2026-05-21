from fastapi import (
    Header
)


async def get_current_user(
    authorization: str = Header(None)
):

    # Authorization removed: always return an empty payload
    return {}