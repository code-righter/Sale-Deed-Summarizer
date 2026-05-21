from app.services.ocr_service import run_ocr

text = run_ocr("page_54.png")

print(text)