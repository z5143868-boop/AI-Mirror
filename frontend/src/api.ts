import axios from 'axios';

// 强制指定后端地址，确保万无一失
const baseURL = 'https://ai-mirror-by6k.onrender.com';

// 创建一个 axios 实例
const api = axios.create({
  baseURL: baseURL,
  timeout: 60000, // 再次延长超时到 60秒 (冷启动真的很慢)
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器（可选：处理错误）
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// 定义 API 接口函数
export const chatWithAI = async (message: string) => {
  try {
    const response = await api.post('/chat', { message });
    return response.data.reply;
  } catch (error) {
    console.error('Chat Error:', error);
    return "抱歉，由于网络原因，我暂时无法回答。";
  }
};

export default api;
