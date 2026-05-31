import asyncio
from groq import AsyncGroq
import os

async def test():
    client = AsyncGroq(api_key=os.environ.get('GROQ_API_KEY'))
    response = await client.chat.completions.create(
        model='llama-3.3-70b-versatile',
        messages=[{'role': 'user', 'content': 'hello'}],
        temperature=0.8
    )
    print(response.choices[0].message.content)

if __name__ == '__main__':
    asyncio.run(test())
