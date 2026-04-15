const axios = require('axios');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4005';

const triggerAppointmentEventNotification = async ({ type, appointment, authHeader, message, recipients = [] }) => {
  try {
    const { data } = await axios.post(
      `${NOTIFICATION_SERVICE_URL}/api/notifications`,
      {
        type,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        message,
        recipients,
        metadata: {
          appointmentId: appointment._id,
          date: appointment.date,
          time: appointment.time,
          status: appointment.status
        }
      },
      {
        headers: authHeader
          ? {
              Authorization: authHeader
            }
          : undefined
      }
    );

      return data;
  } catch (error) {
    // Notification failures should not fail booking.
    console.error('Failed to trigger appointment notification:', error.message);
      return null;
  }
};

module.exports = {
  triggerAppointmentEventNotification
};
