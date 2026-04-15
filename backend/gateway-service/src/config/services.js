const SERVICE_URLS = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
  patient: process.env.PATIENT_SERVICE_URL || 'http://localhost:4002',
  doctor: process.env.DOCTOR_SERVICE_URL || 'http://localhost:4003',
  appointment: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:4004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4005',
  ai: process.env.AI_SERVICE_URL || 'http://localhost:4006'
};

module.exports = {
  SERVICE_URLS
};
