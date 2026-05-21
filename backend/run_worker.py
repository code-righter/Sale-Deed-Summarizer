import os

from rq import Worker
from app.queue.redis_queue import redis_conn
from app.config import REDIS_QUEUE


if __name__ == "__main__":

    print("Worker started in single-process mode")

    worker = Worker([REDIS_QUEUE], connection=redis_conn)

    worker.work()