def build_extraction_prompt(document_text: str) -> str:

    prompt = f"""
You are an expert legal document extraction system specialized in Maharashtra property sale deeds.

Your task is NOT summarization.

Your task is COMPLETE structured extraction of ALL legally relevant information from the provided sale deed document.

STRICT INSTRUCTIONS:

1. Extract information EXACTLY as written in the document.
2. Do NOT hallucinate.
3. Do NOT infer missing information.
4. If information is missing, return null.
5. Preserve:
   - names
   - addresses
   - survey numbers
   - flat numbers
   - registration numbers
   - deed numbers
   - dates
   - monetary amounts
   - installment values
   - boundary descriptions
   EXACTLY as present in document.
6. Do NOT shorten addresses.
7. Do NOT summarize ownership history.
8. Extract ALL ownership transfers mentioned.
9. Extract ALL installments mentioned.
10. Preserve chronological order wherever applicable.
11. Preserve page continuity while understanding the document.
12. Multiple vendors/purchasers/consenting parties may exist.
13. Return ONLY valid JSON.
14. Do NOT add explanations.
15. Do NOT omit repeated legal details if relevant.

RETURN FORMAT:

{{  
    "sale_deed_no": "",
    "vendor_information": [
        {{
            "name": "",
            "address": ""
        }}
    ],

    "purchaser_information": [
        {{
            "name": "",
            "address": ""
        }}
    ],

    "consenting_party_information": [
        {{
            "name": "",
            "address": ""
        }}
    ],

    "ownership_history_information": [
        {{
            "owner_name": "",
            "possession_time_period": "",
            "sale_deed_document_number": "",
            "transfer_details": ""
        }}
    ],

    "property_location_information": {{
        "property_size": "",
        "full_property_address": "",
        "survey_numbers": [],
        "village": "",
        "taluka": "",
        "district": "",
        "cts_number": "",
        "plot_number": "",
        "flat_number": "",
        "building_name": "",
        "boundaries": {{
            "east": "",
            "west": "",
            "north": "",
            "south": ""
        }},
        "adjacent_properties": []
    }},

    "sale_amount_information": {{
        "final_transaction_amount": "",
        "stamp_duty: ",
        "registration_fee": "",
        "currency": "INR",
        "installments": [
            {{
                "amount": "",
                "payment_date": "",
                "payment_mode": "",
                "bank_details": "",
                "remarks": ""
            }}
        ]
    }}
}}

DOCUMENT TEXT:

{document_text}
"""

    return prompt

