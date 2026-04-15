const express = require('express');

const {
  sendEmailNotification,
  sendSmsNotification,
  notifyAppointmentEvent
} = require('../controllers/notificationController');

const router = express.Router();

router.post('/email', sendEmailNotification);
router.post('/sms', sendSmsNotification);
router.post('/', notifyAppointmentEvent);

module.exports = router;
