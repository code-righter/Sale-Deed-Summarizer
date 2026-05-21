import pytesseract
from PIL import Image


def run_ocr(image_path):

    img = Image.open(image_path)

    text = pytesseract.image_to_string(
        img,
        lang="eng+mar"
    )

    return text