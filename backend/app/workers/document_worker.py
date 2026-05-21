from app.core.celery_app import (
    celery_app
)

from app.pipeline.sale_deed_pipeline import (
    process_sale_deed_pipeline
)


@celery_app.task(

    bind=True,

    name="process_sale_deed",

    autoretry_for=(Exception,),

    retry_kwargs={
        "max_retries": 3
    },

    retry_backoff=True,

    retry_jitter=True
)
def process_sale_deed_task(

    self,

    document_id: str,

    pdf_path: str,

    original_filename: str
):

    process_sale_deed_pipeline(

        document_id=document_id,

        pdf_path=pdf_path,

        original_filename=original_filename
    )