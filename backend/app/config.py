import os
from dotenv import load_dotenv

load_dotenv()   # loads .env file

REDIS_URL = os.getenv("REDIS_URL")
REDIS_QUEUE = os.getenv("REDIS_QUEUE", "document_queue")