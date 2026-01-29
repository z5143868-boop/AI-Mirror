import { useState, useEffect, useRef } from 'react';
import { chatWithAI, generateScenario, generateReport, generateTags, generateShadowWork, submitShadowWork, selectTags, submitScenarioChoice } from '../api';
import { Send, Brain, FileText, User, Image as ImageIcon, X, Hash, Moon, Check, RefreshCw } from 'lucide-react';

interface ChatInterfaceProps {
  userId: string;
  userProfile: any;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  type?: 'text' | 'scenario' | 'report' | 'tags' | 'shadow'; 
  data?: any; 
  image?: string; 
}

export default function ChatInterface({ userId, userProfile }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-initiate conversation if empty
  useEffect(() => {
    if (messages.length === 0 && userProfile) {
        const initChat = async () => {
            setIsLoading(true);
            try {
                // Send a hidden system prompt to start the conversation contextually
                // We don't add this prompt to the 'messages' state so the user doesn't see it as their own message
                // But we want the AI to reply to it.
                const prompt = `[SYSTEM_INIT] 用户已完成初始化，当前状态：
                - 昵称: ${userProfile.basic_info.nickname}
                - 职业: ${userProfile.basic_info.job}
                - MBTI: ${userProfile.mbti_result || '未知'}
                
                请以 AI Mirror (心理镜像) 的身份发起第一轮对话。
                1. 确认已接收到用户的 MBTI 结果。
                2. 简要分析这个 MBTI 类型在职场(${userProfile.basic_info.job})中的典型表现。
                3. 邀请用户分享最近的一件心事。
                4. 在结尾处，温和地提示用户，如果不知道从何说起，可以尝试左侧的【性格标签】或【场景模拟】来开始探索。
                
                语气要求：温暖、洞察力强、像一位老朋友。`;
                
                const reply = await chatWithAI(userId, prompt);
                setMessages([{ role: 'ai', content: reply }]);
            } catch (error) {
                console.error("Auto-chat failed", error);
            } finally {
                setIsLoading(false);
            }
        };
        initChat();
    }
  }, [userId, userProfile]); // Run once when profile is loaded and messages are empty

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() && !selectedImage) return;

    const userMsg: Message = { 
        role: 'user', 
        content: inputValue,
        image: selectedImage || undefined
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    const imageToSend = selectedImage;
    clearImage(); 
    setIsLoading(true);

    try {
      const reply = await chatWithAI(userId, inputValue, imageToSend || undefined);
      setMessages(prev => [...prev, { role: 'ai', content: reply }]);
    } catch (error) {
        console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateScenario = async () => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'ai', content: "正在为你生成专属场景测试..." }]);
    try {
      const scenario = await generateScenario(userId);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: scenario.question, 
        type: 'scenario', 
        data: scenario 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "生成场景失败，请稍后再试。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScenarioChoice = async (choiceText: string, projection: string) => {
      setMessages(prev => [...prev, { role: 'user', content: `我选择了：${choiceText}` }]);
      setIsLoading(true);
      try {
          const reply = await submitScenarioChoice(userId, choiceText, projection);
          setMessages(prev => [...prev, { role: 'ai', content: reply }]);
      } catch (error) {
          console.error(error);
      } finally {
          setIsLoading(false);
      }
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'ai', content: "正在深度分析你的心理画像，生成报告中（可能需要几十秒）..." }]);
    try {
      const report = await generateReport(userId);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: "报告已生成！", 
        type: 'report', 
        data: report 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "生成报告失败，请稍后再试。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTags = async () => {
      setIsLoading(true);
      setMessages(prev => [...prev, { role: 'ai', content: "正在提炼你的性格关键词..." }]);
      try {
          const tags = await generateTags(userId);
          setMessages(prev => [...prev, {
              role: 'ai',
              content: "请点击选择最符合你的标签，点击确认保存。",
              type: 'tags',
              data: tags
          }]);
      } catch (error) {
          setMessages(prev => [...prev, { role: 'ai', content: "生成标签失败。" }]);
      } finally {
          setIsLoading(false);
      }
  };

  const toggleTag = (tag: string) => {
      if (selectedTags.includes(tag)) {
          setSelectedTags(selectedTags.filter(t => t !== tag));
      } else {
          setSelectedTags([...selectedTags, tag]);
      }
  };

  const handleTagsSubmit = async () => {
      if (selectedTags.length === 0) return;
      setIsLoading(true);
      try {
          await selectTags(userId, selectedTags);
          setMessages(prev => [...prev, { 
              role: 'user', 
              content: `我选择了这些标签：${selectedTags.join(', ')}` 
          }]);
          setTimeout(() => {
              setMessages(prev => [...prev, { 
                  role: 'ai', 
                  content: "已记录你的自我认同。这些标签将帮助我更准确地理解你。" 
              }]);
          }, 800);
          setSelectedTags([]); // Clear selection state
      } catch (error) {
          console.error(error);
      } finally {
          setIsLoading(false);
      }
  };

  const handleGenerateShadow = async () => {
      setIsLoading(true);
      setMessages(prev => [...prev, { role: 'ai', content: "正在探索你的潜意识阴影..." }]);
      try {
          const result = await generateShadowWork(userId);
          setMessages(prev => [...prev, {
              role: 'ai',
              content: "阴影探索",
              type: 'shadow',
              data: result
          }]);
      } catch (error) {
          setMessages(prev => [...prev, { role: 'ai', content: "生成阴影问题失败。" }]);
      } finally {
          setIsLoading(false);
      }
  };
  
  const handleShadowSubmit = async (question: string, admitted: boolean) => {
      await submitShadowWork(userId, question, admitted);
      setMessages(prev => [...prev, { 
          role: 'user', 
          content: admitted ? "我承认这一点。" : "我不这么认为。" 
      }]);
      setTimeout(() => {
          setMessages(prev => [...prev, { 
            role: 'ai', 
            content: admitted ? "承认是疗愈的开始。让我们深入聊聊这个感受..." : "没关系，每个人都有自我保护机制。我们可以换个话题。" 
          }]);
      }, 1000);
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-16 md:w-20 bg-slate-800 flex flex-col items-center py-8 space-y-6 border-r border-slate-700">
        <div className="p-3 bg-blue-600 rounded-xl mb-4">
           <Brain size={24} />
        </div>
        
        <button onClick={handleGenerateScenario} className="p-3 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-blue-400" title="生成场景测试">
          <User size={24} />
        </button>
        
        <button onClick={handleGenerateTags} className="p-3 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-yellow-400" title="性格标签云">
          <Hash size={24} />
        </button>

        <button onClick={handleGenerateShadow} className="p-3 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-purple-400" title="阴影探索">
          <Moon size={24} />
        </button>

        <div className="flex-1"></div>
        
        <button onClick={handleGenerateReport} className="p-3 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-green-400" title="生成心理报告">
          <FileText size={24} />
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-slate-700 flex items-center px-6 bg-slate-800/50 backdrop-blur justify-between">
          <div className="flex items-center">
            <h2 className="font-bold text-lg">AI Mirror</h2>
            <span className="ml-4 text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                {userProfile.basic_info.nickname}
            </span>
          </div>
          {userProfile.mbti_result && (
              <span className="text-xs font-bold bg-purple-600 px-3 py-1 rounded-full text-white">
                  {userProfile.mbti_result}
              </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 mt-20">
              <p className="text-xl mb-2">👋 欢迎回来，{userProfile.basic_info.nickname}</p>
              <p>我们可以聊聊你的工作、生活，或者点击左侧按钮进行深度探索。</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] space-y-2`}>
                <div className={`p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-slate-700 text-slate-200 rounded-tl-none'
                }`}>
                  {msg.image && (
                    <img 
                      src={msg.image} 
                      alt="User uploaded" 
                      className="max-w-full rounded-lg mb-2" 
                      style={{ maxHeight: '200px' }}
                    />
                  )}
                  {msg.content}
                </div>

                {/* Scenario Card */}
                {msg.type === 'scenario' && msg.data && (
                  <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 mt-2 space-y-3">
                    <p className="text-sm text-slate-400 font-bold">🎯 场景模拟</p>
                    <div className="space-y-2">
                      {msg.data.options.map((opt: any, idx: number) => (
                        <button 
                          key={idx}
                          className="w-full text-left p-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-sm border border-transparent hover:border-blue-500"
                          onClick={() => handleScenarioChoice(opt.text, opt.projection)}
                        >
                          <span className="font-bold text-blue-400 mr-2">{opt.label}.</span>
                          {opt.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Tag Cloud */}
                {msg.type === 'tags' && msg.data && (
                    <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 mt-2">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-sm text-slate-400 font-bold">🏷️ 你的性格关键词 (可多选)</p>
                            {selectedTags.length > 0 && (
                                <button 
                                    onClick={handleTagsSubmit}
                                    className="text-xs bg-green-600 hover:bg-green-500 px-3 py-1 rounded-full text-white font-bold transition-colors flex items-center"
                                >
                                    <Check size={12} className="mr-1"/> 确认保存 ({selectedTags.length})
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {(msg.data as string[]).map((tag, i) => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <button 
                                        key={i} 
                                        onClick={() => toggleTag(tag)}
                                        className={`px-3 py-1 rounded-full text-sm transition-all border ${
                                            isSelected 
                                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500' 
                                            : 'bg-slate-700 text-slate-300 border-transparent hover:border-slate-500'
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Shadow Work Card */}
                {msg.type === 'shadow' && msg.data && (
                    <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-purple-500/30 rounded-xl p-6 mt-2 shadow-lg">
                        <div className="flex items-center mb-4">
                            <Moon size={18} className="text-purple-400 mr-2" />
                            <h3 className="text-purple-200 font-bold">阴影探索</h3>
                        </div>
                        <p className="text-lg font-medium text-white mb-6 leading-relaxed">
                            "{msg.data.question}"
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => handleShadowSubmit(msg.data.question, false)}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors flex items-center justify-center group"
                            >
                                <X size={18} className="mr-2 text-slate-500 group-hover:text-slate-300"/> 
                                否认 / 跳过
                            </button>
                            <button 
                                onClick={() => handleShadowSubmit(msg.data.question, true)}
                                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-bold transition-colors flex items-center justify-center"
                            >
                                <Check size={18} className="mr-2"/>
                                是的，我承认
                            </button>
                        </div>
                    </div>
                )}

                {/* Report Card */}
                {msg.type === 'report' && msg.data && (
                  <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 mt-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-green-400">深度心理镜像报告</h3>
                        <span className="text-xs text-slate-500">V1.0</span>
                    </div>
                    <div className="prose prose-invert prose-sm max-h-96 overflow-y-auto custom-scrollbar">
                        <div className="whitespace-pre-wrap">{msg.data.full_markdown}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-slate-700 p-3 rounded-2xl rounded-tl-none text-slate-400 animate-pulse text-sm">
                 AI 正在思考...
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-800 border-t border-slate-700">
            {selectedImage && (
            <div className="mb-2 relative inline-block">
              <img 
                src={selectedImage} 
                alt="Selected" 
                className="h-20 rounded-lg border border-slate-600" 
              />
              <button 
                onClick={clearImage}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <div className="flex gap-2 relative">
             <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 transition-colors"
              title="上传图片"
            >
              <ImageIcon size={20} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageSelect}
            />
            <input
              type="text"
              className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
              placeholder="输入你的想法..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="absolute right-2 top-2 p-1.5 bg-blue-500 hover:bg-blue-400 rounded-lg text-white transition-colors disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
