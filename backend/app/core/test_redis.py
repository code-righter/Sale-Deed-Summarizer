from app.core.redis_client import redis_client


try:

    redis_client.set(
        "test_key",
        "redis_working"
    )

    value = redis_client.get("test_key")

    print("Redis Connected Successfully")
    print("Value:", value)

except Exception as e:

    print("Redis Connection Failed")
    print(str(e))