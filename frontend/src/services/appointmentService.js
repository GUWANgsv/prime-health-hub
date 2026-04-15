import api from "./api";

export const appointmentService = {
  async getMyAppointments(status) {
    const params = status && status !== "ALL" ? { status } : undefined;
    const { data } = await api.get("/api/appointments/my", { params });
    return data;
  },

  async getMyStats() {
    const { data } = await api.get("/api/appointments/stats/my");
    return data;
  },

  async getAdminOverview() {
    const { data } = await api.get("/api/appointments/admin/overview");
    return data;
  },

  async getDoctorAppointments() {
    const { data } = await api.get("/api/appointments/doctor/my");
    return data;
  },

  async bookAppointment(payload) {
    const { data } = await api.post("/api/appointments", payload);
    return data;
  },

  async cancelAppointment(appointmentId) {
    const { data } = await api.patch(`/api/appointments/${appointmentId}/cancel`);
    return data;
  },

  async rescheduleAppointment(appointmentId, payload) {
    const { data } = await api.patch(`/api/appointments/${appointmentId}/reschedule`, payload);
    return data;
  },

  async updateAppointmentStatus(appointmentId, status) {
    const { data } = await api.patch(`/api/appointments/${appointmentId}/status`, { status });
    return data;
  },

  async updateVideoCall(appointmentId, videoCallUrl) {
    const { data } = await api.patch(`/api/appointments/${appointmentId}/video-call`, { videoCallUrl });
    return data;
  },

  async issuePrescription(appointmentId, prescriptionText) {
    const { data } = await api.patch(`/api/appointments/${appointmentId}/prescription`, { prescriptionText });
    return data;
  },

  async initiatePayHerePayment(appointmentId) {
    const { data } = await api.post(`/api/appointments/${appointmentId}/payment/payhere/initiate`);
    return data;
  }
};
