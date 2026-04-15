import api from "./api";

export const aiService = {
  async analyzeSymptoms(symptoms, userId) {
    const { data } = await api.post("/api/ai/analyze", { symptoms, userId });
    return data;
  }
};
