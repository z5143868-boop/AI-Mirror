import axios from 'axios';

// 区分开发环境和生产环境
const baseURL = import.meta.env.PROD 
  ? 'https://ai-mirror-by6k.onrender.com' // 生产环境（Render 后端）
  : '/api'; // 开发环境（本地代理）

// 创建一个 axios 实例
const api = axios.create({
  baseURL: baseURL,
  timeout: 30000, // 请求超时时间
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
