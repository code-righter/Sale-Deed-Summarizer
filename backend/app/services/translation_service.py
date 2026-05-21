from deep_translator import GoogleTranslator


def translate_text(text):

    translated = GoogleTranslator(
        source="mr",
        target="en"
    ).translate(text)
    
    return translated