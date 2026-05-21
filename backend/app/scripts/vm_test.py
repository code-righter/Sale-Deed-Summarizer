import asyncio
import httpx

async def extract_entities(deed_text: str):
    # Using 'async with' ensures the client closes correctly after the request
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "qwen2.5:14b",
                "prompt": f"Extract entities from this sale deed as JSON: {deed_text}",
                "stream": False
            },
            timeout=None # Large models can take time to generate response
        )
    return response.json()["response"]

async def main():
    test_deed = "This Sale Deed is executed between Mr. A (Seller) and Ms. B (Buyer)..."
    try:
        entities = await extract_entities(test_deed)
        print("Extracted Entities:")
        print(entities)
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(main())
