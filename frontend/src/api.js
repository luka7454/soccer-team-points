import axios from 'axios';

// API 기본 URL 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://port-0-soccer-team-points-magjme9514f49857.sel4.cloudtype.app/api';

// API 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 멤버 관련 API 함수
export const memberAPI = {
  // 모든 멤버 조회
  getAll: async () => {
    try {
      const response = await api.get('/members');
      return response.data;
    } catch (error) {
      console.error('Error fetching members:', error);
      throw error;
    }
  },
  
  // 새 멤버 추가
  create: async (memberData) => {
    try {
      const response = await api.post('/members', memberData);
      return response.data;
    } catch (error) {
      console.error('Error creating member:', error);
      throw error;
    }
  },
  
  // 멤버 정보 수정
  update: async (id, memberData) => {
    try {
      const response = await api.put(`/members/${id}`, memberData);
      return response.data;
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  },
  
  // 멤버 삭제
  delete: async (id) => {
    try {
      const response = await api.delete(`/members/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  },
  
  // 특정 카테고리 점수 증가/감소
  updateScore: async (id, category, value) => {
    try {
      const response = await api.patch(`/members/${id}/${category}`, { value });
      return response.data;
    } catch (error) {
      console.error('Error updating score:', error);
      throw error;
    }
  },
  
  // 대량 멤버 추가 (Excel 업로드 등)
  bulkImport: async (members) => {
    try {
      const response = await api.post('/members/bulk', { members });
      return response.data;
    } catch (error) {
      console.error('Error bulk importing members:', error);
      throw error;
    }
  }
};

// 카테고리 관련 API 함수
export const categoryAPI = {
  // 모든 카테고리 조회
  getAll: async () => {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },
  
  // 카테고리 정보 수정
  update: async (id, categoryData) => {
    try {
      const response = await api.put(`/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },
  
  // 키로 카테고리 정보 수정
  updateByKey: async (key, categoryData) => {
    try {
      const response = await api.put(`/categories/key/${key}`, categoryData);
      return response.data;
    } catch (error) {
      console.error('Error updating category by key:', error);
      throw error;
    }
  }
};

export default {
  member: memberAPI,
  category: categoryAPI
};
