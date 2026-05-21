import redis
from rq import Queue

from app.config import REDIS_URL, REDIS_QUEUE

redis_conn = redis.from_url(REDIS_URL)

document_queue = Queue(
    REDIS_QUEUE,
    connection=redis_conn
)