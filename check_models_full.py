import google.generativeai as genai
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), 'backend', '.env'))

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("No API Key found")
else:
    genai.configure(api_key=api_key)
    try:
        print(f"Checking API Key: {api_key[:5]}...{api_key[-5:]}")
        print("Listing available models:")
        for m in genai.list_models():
            # 打印所有模型，不进行过滤，看看究竟有哪些
            print(f"- {m.name}: {m.supported_generation_methods}")
    except Exception as e:
        print(f"Error listing models: {e}")
