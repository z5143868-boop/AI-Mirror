import axios from 'axios';

// 创建一个 axios 实例
const api = axios.create({
  baseURL: '/api', // 使用相对路径，触发 Vite 代理
  timeout: 30000, // 请求超时时间增加到 30s
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
