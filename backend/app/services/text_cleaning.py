# app/utils/text_cleaning.py

import re
import unicodedata


def normalize_text(text: str) -> str:
    # 1️⃣ Unicode normalization
    text = unicodedata.normalize("NFKC", text)

    # 2️⃣ Convert escaped sequences
    text = text.replace("\\n", "\n").replace("\\t", " ")

    # 3️⃣ Remove control characters
    text = re.sub(r'[\x00-\x1F\x7F]', ' ', text)

    # 4️⃣ Remove unwanted symbols (keep useful ones)
    text = re.sub(r'[^\w\s.,:/\-()%]', ' ', text)

    # 5️⃣ Fix broken OCR words
    text = re.sub(r'\b(\w)\s+(\w)\b', r'\1\2', text)

    # 6️⃣ Fix punctuation spacing
    text = re.sub(r'\s*\.\s*', '.', text)

    # 7️⃣ Normalize spaces (preserve line breaks)
    text = re.sub(r'[ \t]+', ' ', text)

    # 8️⃣ Normalize newlines
    text = re.sub(r'\n+', '\n', text)

    return text.strip()