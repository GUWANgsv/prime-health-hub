import api from "./api";

export const patientService = {
  async createPatientProfile(payload) {
    const { data } = await api.post("/api/patients", payload);
    return data;
  },

  async getMyProfile() {
    const { data } = await api.get("/api/patients/me");
    return data;
  },

  async updateProfile(patientId, payload) {
    const { data } = await api.put(`/api/patients/${patientId}`, payload);
    return data;
  },

  async deleteProfile(patientId) {
    const { data } = await api.delete(`/api/patients/${patientId}`);
    return data;
  },

  async addReport(patientId, payload) {
    const formData = new FormData();
    formData.append("report", payload.file);
    const { data } = await api.post(`/api/patients/${patientId}/reports`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data;
  },

  async getReports(patientId) {
    const { data } = await api.get(`/api/patients/${patientId}/reports`);
    return data;
  },

  async getReportsForDoctor(patientUserId) {
    const { data } = await api.get(`/api/patients/by-user/${patientUserId}/reports/doctor`);
    return data;
  },

  async downloadReport(patientId, reportId) {
    const response = await api.get(`/api/patients/${patientId}/reports/${reportId}/download`, {
      responseType: "blob"
    });
    return response;
  },

  async downloadReportForDoctor(patientUserId, reportId) {
    const response = await api.get(`/api/patients/by-user/${patientUserId}/reports/${reportId}/download/doctor`, {
      responseType: "blob"
    });
    return response;
  }
};
