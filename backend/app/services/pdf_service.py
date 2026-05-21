from pdf2image import convert_from_path
import os


def pdf_to_images(file_path):

    images = convert_from_path(file_path)

    paths = []

    folder = os.path.dirname(file_path)

    for i, img in enumerate(images):

        path = f"{folder}/page_{i}.png"
        img.save(path)

        paths.append(path)

    return paths