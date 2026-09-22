import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const chatApi = {
  // Gửi câu hỏi học tập đến StudyMate Bot
  sendMessage: async (userId, message) => {
    const response = await apiClient.post('/chat/message/', {
      user_id: userId,
      message,
    });
    return response.data;
  },

  // Tải lịch sử chat của phiên
  getHistory: async (userId) => {
    const response = await apiClient.get('/chat/history/', {
      params: { user_id: userId },
    });
    return response.data;
  },

  // Rút lại tin nhắn chat (Unsend — đánh dấu đã rút, loại bỏ khỏi ngữ cảnh LLM)
  unsendMessage: async (messageId, userId) => {
    const response = await apiClient.post(`/chat/message/${messageId}/recall/`, {
      user_id: userId,
    });
    return response.data;
  },

  // Xóa vĩnh viễn 1 tin nhắn
  deleteMessage: async (messageId, userId) => {
    const response = await apiClient.delete(`/chat/message/${messageId}/`, {
      params: { user_id: userId },
    });
    return response.data;
  },

  // Xóa toàn bộ lịch sử trò chuyện của phiên
  clearHistory: async (userId) => {
    const response = await apiClient.delete('/chat/history/', {
      params: { user_id: userId },
    });
    return response.data;
  },
};

export const memoryApi = {
  // Lấy trạng thái Walrus Memory (MemWal) hiện tại của học viên
  getMemoryStatus: async (userId) => {
    const response = await apiClient.get('/memory/status/', {
      params: { user_id: userId },
    });
    return response.data;
  },

  // Đồng bộ/Ghi đè ký ức dài hạn lên Walrus Protocol
  syncMemory: async (userId, memoryPayload) => {
    const response = await apiClient.post('/memory/sync/', {
      user_id: userId,
      memory_payload: memoryPayload,
    });
    return response.data;
  },
};

export default apiClient;
