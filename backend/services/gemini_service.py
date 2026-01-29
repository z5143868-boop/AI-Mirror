import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

# 加载环境变量
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

class GeminiService:
    def __init__(self):
        self.api_key = os.getenv("OPEN_ROUTER_API_KEY")
        if not self.api_key:
            # Fallback to verify if GEMINI_API_KEY was intended, but strictly we need OpenRouter key now
            print("Warning: OPEN_ROUTER_API_KEY not found, checking for GEMINI_API_KEY as backup...")
            self.api_key = os.getenv("GEMINI_API_KEY")
            
        if not self.api_key:
             raise ValueError("API Key not found. Please set OPEN_ROUTER_API_KEY in .env")

        # OpenRouter Configuration
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=self.api_key,
        )
        # Using a model that is likely available on OpenRouter free tier or generally available
        # Updated to a known valid model ID on OpenRouter
        self.model_name = "google/gemini-2.0-flash-001" 

    async def generate_content_async(self, prompt: str, image_data: str = None) -> str:
        try:
            message_content = []
            if image_data:
                # Ensure image_data is formatted correctly as a data URL if it isn't already
                if not image_data.startswith("data:image"):
                    # Assume it's base64 raw data, default to jpeg if unknown, but better to handle in caller
                    # For now, let's assume the caller passes the full data URL or valid base64
                    # Standard OpenAI format expects data URL for base64
                    image_url = image_data if image_data.startswith("http") or image_data.startswith("data:") else f"data:image/jpeg;base64,{image_data}"
                    
                    message_content = [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_url
                            }
                        }
                    ]
                else:
                     message_content = [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_data
                            }
                        }
                    ]
            else:
                message_content = prompt

            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "user", "content": message_content}
                ],
                # OpenRouter specific headers if needed
                extra_headers={
                    "HTTP-Referer": "https://ai-mirror.vercel.app", # Optional, for OpenRouter rankings
                    "X-Title": "AI Mirror"
                }
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error communicating with OpenRouter: {str(e)}"
