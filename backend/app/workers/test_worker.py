from app.core.celery_app import celery_app


@celery_app.task
def add_numbers(a, b):

    print(f"Adding {a} + {b}")

    return a + b