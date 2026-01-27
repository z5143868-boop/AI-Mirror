import { useState } from 'react';
import { chatWithAI } from './api';

function App() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    // 1. 添加用户消息到列表
    const userMessage = { role: 'user' as const, content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // 2. 调用 API 获取 AI 回复
    const aiResponse = await chatWithAI(inputValue);

    // 3. 添加 AI 消息到列表
    const aiMessage = { role: 'ai' as const, content: aiResponse };
    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white font-sans">
      {/* 顶部标题 */}
      <div className="p-4 bg-slate-800 shadow-md text-center font-bold text-lg text-blue-300">
        AI Mirror - 你的数字镜像
      </div>

      {/* 聊天内容区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 mt-20">
            <p>你好，我是 AI Mirror。</p>
            <p>和我聊聊你的故事吧...</p>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-700 text-slate-200 rounded-tl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 p-3 rounded-2xl rounded-tl-none text-slate-400 animate-pulse">
              正在思考...
            </div>
          </div>
        )}
      </div>

      {/* 底部输入框 */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-slate-700 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="输入你的想法..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className={`px-6 py-2 rounded-full font-bold transition-colors ${
              isLoading
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-400 text-white'
            }`}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
