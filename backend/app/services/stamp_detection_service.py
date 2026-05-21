START_SEQUENCE = [
    "sale deed",
    "between",
    "hereinafter",
    "vendor",
    "party of the first part",
    "and"
]

END_KEYWORDS = [
    "photo",
    "thumb",
    "signature"
]


def contains_ordered_sequence(text, sequence):

    current_index = 0

    for keyword in sequence:

        found_index = text.find(keyword, current_index)

        if found_index == -1:
            return False

        current_index = found_index + len(keyword)

    return True


def detect_stamp_pages(pages):

    start_page = None
    end_page = None

    # -------------------------
    # START DETECTION
    # -------------------------

    for idx, page in enumerate(pages):

        text = page["translated_text"].lower()

        if contains_ordered_sequence(text, START_SEQUENCE):

            start_page = idx
            break

    # -------------------------
    # END DETECTION
    # -------------------------

    if start_page is not None:

        for idx in range(start_page + 1, len(pages)):

            text = pages[idx]["translated_text"].lower()

            keyword_matches = 0

            for keyword in END_KEYWORDS:

                if keyword in text:
                    keyword_matches += 1

            # if 2 or more keywords found
            if keyword_matches >= 2:

                end_page = idx
                break

    # -------------------------
    # EXTRACT RANGE
    # -------------------------

    if start_page is None:
        return []

    if end_page is None:
        return pages[start_page:]

    return pages[start_page:end_page]