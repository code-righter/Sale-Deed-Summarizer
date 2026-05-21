import asyncio
from db import client

async def test_connection():
    try:
        await client.admin.command("ping")
        print("MongoDB Connected Successfully")
    except Exception as e:
        print("MongoDB Connection Failed")
        print(e)

asyncio.run(test_connection())