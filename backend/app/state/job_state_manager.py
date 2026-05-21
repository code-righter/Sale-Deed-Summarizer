import json
import time

from app.core.redis_client import (
    redis_client
)


JOB_EXPIRY_SECONDS = 86400


# =========================================================
# SET JOB STATE
# =========================================================

def set_job_state(
    job_id: str,
    status: str,
    step: str,
    progress: int,
    message: str,
    data=None
):

    payload = {

        "job_id": job_id,

        "status": status,

        "step": step,

        "progress": progress,

        "message": message,

        "data": data or {},

        "updated_at": int(time.time())
    }

    redis_client.setex(

        f"job:{job_id}",

        JOB_EXPIRY_SECONDS,

        json.dumps(payload)
    )


# =========================================================
# GET JOB STATE
# =========================================================

def get_job_state(
    job_id: str
):

    data = redis_client.get(
        f"job:{job_id}"
    )

    if not data:
        return None

    return json.loads(data)


# =========================================================
# PROCESSING LOCK
# =========================================================

def acquire_job_lock(
    job_id: str
):

    return redis_client.set(

        f"lock:{job_id}",

        "locked",

        nx=True,

        ex=3600
    )


def release_job_lock(
    job_id: str
):

    redis_client.delete(
        f"lock:{job_id}"
    )