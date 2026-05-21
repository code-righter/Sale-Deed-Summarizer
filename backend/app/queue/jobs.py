from app.queue.redis_queue import document_queue
from backend.app.workers.document_worker import process_document


def enqueue_document_job(document_id, file_path):

    job = document_queue.enqueue(
        process_document,
        document_id,
        file_path,
        job_timeout=600
    )

    return job.id