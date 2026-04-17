import api from "./api";

export const authService = {
  async register(payload) {
    const { data } = await api.post("/api/auth/register", payload);
    return data;
  },

  async login(payload) {
    const { data } = await api.post("/api/auth/login", payload);
    return data;
  },

  async verifyForgotPasswordEmail(payload) {
    const { data } = await api.post("/api/auth/forgot-password/verify", payload);
    return data;
  },

  async resetForgotPassword(payload) {
    const { data } = await api.post("/api/auth/forgot-password/reset", payload);
    return data;
  },

  async getProfile() {
    const { data } = await api.get("/api/auth/profile");
    return data;
  },

  async updateProfile(payload) {
    const { data } = await api.put("/api/auth/profile", payload);
    return data;
  },

  async listUsers(params = {}) {
    const { data } = await api.get("/api/auth/admin/users", { params });
    return data;
  },

  async updateUser(userId, payload) {
    const { data } = await api.put(`/api/auth/admin/users/${userId}`, payload);
    return data;
  },

  async deleteUser(userId) {
    const { data } = await api.delete(`/api/auth/admin/users/${userId}`);
    return data;
  }
};
