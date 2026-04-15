import api from "./api";

export const doctorService = {
  async createDoctorProfile(payload) {
    const { data } = await api.post("/api/doctors", payload);
    return data;
  },

  async getMyProfile() {
    const { data } = await api.get("/api/doctors/me");
    return data;
  },

  async updateDoctorProfile(doctorId, payload) {
    const { data } = await api.put(`/api/doctors/${doctorId}`, payload);
    return data;
  },

  async deleteDoctorProfile(doctorId) {
    const { data } = await api.delete(`/api/doctors/${doctorId}`);
    return data;
  },

  async searchApprovedDoctors(params = {}) {
    const { data } = await api.get("/api/doctors", {
      params: {
        approvedOnly: true,
        specialization: params.specialization || undefined,
        name: params.name || undefined
      }
    });
    return data;
  },

  async getAllDoctors(params = {}) {
    const { data } = await api.get("/api/doctors", {
      params: {
        status: params.status || undefined,
        name: params.name || undefined,
        specialization: params.specialization || undefined
      }
    });
    return data;
  },

  async approveDoctor(doctorId) {
    const { data } = await api.patch(`/api/doctors/${doctorId}/approve`);
    return data;
  }
};
