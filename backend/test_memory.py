import asyncio
from services.memory_service import RollingMemoryService
from models import UserProfile, BasicInfo

async def test_memory():
    print("--- Testing Memory Service ---")
    
    # 1. 模拟一个用户画像
    profile = UserProfile(
        profile_id="p1",
        user_id="u1",
        basic_info=BasicInfo(nickname="Alex", age=28, job="Product Manager"),
        rolling_summary="用户Alex是一位28岁的产品经理。他目前工作压力较大，担心项目延期。"
    )
    
    # 2. 模拟一段新对话
    new_chat_logs = [
        "User: 我最近感觉好多了，项目终于上线了。",
        "AI: 那真是太棒了！恭喜你，现在的感觉怎么样？",
        "User: 感觉如释重负，打算下周去海边度假放松一下。",
        "AI: 听起来是个完美的计划，海边确实能让人平静。"
    ]
    
    print(f"Old Summary: {profile.rolling_summary}")
    print(f"New Chat Logs: {len(new_chat_logs)} lines")
    
    # 3. 初始化服务并运行
    service = RollingMemoryService()
    updated_summary = await service.update_summary(profile, new_chat_logs)
    
    print("\n--- Updated Summary ---")
    print(updated_summary)
    print("-----------------------")

if __name__ == "__main__":
    asyncio.run(test_memory())
