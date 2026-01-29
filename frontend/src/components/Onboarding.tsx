import { useState } from 'react';
import { OnboardingData } from '../api';

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    nickname: '',
    age: '',
    gender: '',
    job: '',
    income: '',
    core_trouble: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await onComplete(formData);
    } catch (error) {
        console.error(error);
        setLoading(false);
    }
  };

  const handleChange = (field: keyof OnboardingData, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4 font-sans">
      <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="text-center mb-10">
            <div className="inline-block p-3 rounded-full bg-blue-500/10 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"></div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                AI Mirror
            </h1>
            <p className="text-slate-500">Stage 0: 锚定现状</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Nickname */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">怎么称呼你？</label>
                    <input 
                        required 
                        type="text" 
                        placeholder="昵称"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                        value={formData.nickname} 
                        onChange={e => handleChange('nickname', e.target.value)} 
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Gender */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">性别</label>
                        <select 
                            required 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                            value={formData.gender} 
                            onChange={e => handleChange('gender', e.target.value)}
                        >
                            <option value="">请选择...</option>
                            <option value="Male">男</option>
                            <option value="Female">女</option>
                            <option value="Non-binary">其他</option>
                        </select>
                    </div>

                    {/* Age Group */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">年龄段</label>
                        <select 
                            required 
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                            value={formData.age} 
                            onChange={e => handleChange('age', e.target.value)}
                        >
                            <option value="">请选择...</option>
                            <option value="18-24">18-24岁</option>
                            <option value="25-30">25-30岁</option>
                            <option value="31-40">31-40岁</option>
                            <option value="41-50">41-50岁</option>
                            <option value="50+">50岁以上</option>
                        </select>
                    </div>
                </div>

                {/* Occupation */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">职业身份</label>
                    <input 
                        required 
                        type="text" 
                        placeholder="例如：产品经理、艺术家、学生"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                        value={formData.job} 
                        onChange={e => handleChange('job', e.target.value)} 
                    />
                </div>

                {/* Economic Security (Emotional) */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">经济安全感</label>
                    <select 
                        required 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                        value={formData.income} 
                        onChange={e => handleChange('income', e.target.value)}
                    >
                        <option value="">你对金钱的感觉是？</option>
                        <option value="Survival Mode">生存模式 (焦虑)</option>
                        <option value="Stable">稳定但谨慎</option>
                        <option value="Comfortable">舒适/宽裕</option>
                        <option value="Wealthy">财务自由</option>
                    </select>
                </div>

                {/* Core Trouble */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">当前核心困扰</label>
                    <textarea 
                        required 
                        rows={3}
                        placeholder="是什么让你夜不能寐？"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600 resize-none"
                        value={formData.core_trouble} 
                        onChange={e => handleChange('core_trouble', e.target.value)} 
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "初始化中..." : "开启探索之旅"}
                </button>

            </form>
        </div>
      </div>
    </div>
  );
}
