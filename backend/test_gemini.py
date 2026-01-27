import asyncio
from services.gemini_service import GeminiService
import os

async def test_gemini():
    print("--- Testing Gemini Service ---")
    
    # 检查 API Key 是否存在 (仅仅是为了测试脚本的友好提示)
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        # 尝试手动加载，因为这个脚本是直接运行的
        from dotenv import load_dotenv
        load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))
    
    try:
        service = GeminiService()
        print("Successfully initialized GeminiService.")
        
        prompt = "Hello, Gemini! Please reply with a short funny joke."
        print(f"Sending prompt: {prompt}")
        
        response = await service.generate_content_async(prompt)
        print("\n--- Response from Gemini ---")
        print(response)
        print("----------------------------")
        
    except Exception as e:
        print(f"\nTest Failed: {e}")
        print("Please make sure you have set GEMINI_API_KEY in backend/.env")

if __name__ == "__main__":
    asyncio.run(test_gemini())
