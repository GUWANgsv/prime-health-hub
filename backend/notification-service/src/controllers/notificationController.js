const mongoose = require('mongoose');

const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { sendEmail } = require('../utils/emailClient');
const { sendSms } = require('../utils/smsClient');
const { executeWithRetry } = require('../utils/retry');

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const validateUserId = (userId) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError('valid userId is required', 400);
  }
};

const normalizeRecipients = (recipients = []) =>
  Array.isArray(recipients)
    ? recipients
        .map((item) => ({
          userId: item?.userId,
          role: item?.role || '',
          name: item?.name || '',
          email: item?.email || '',
          phone: item?.phone || ''
        }))
        .filter((item) => item.userId && mongoose.Types.ObjectId.isValid(item.userId))
    : [];

const logNotification = async ({
  userId,
  message,
  type,
  status,
  recipient,
  subject = '',
  eventType = '',
  retryCount = 0,
  lastError = ''
}) =>
  Notification.create({
    userId,
    message,
    type,
    status,
    recipient,
    subject,
    eventType,
    retryCount,
    lastError
  });

const sendEmailNotification = asyncHandler(async (req, res) => {
  const { userId, to, subject, message, eventType } = req.body;

  validateUserId(userId);

  if (!to || !isValidEmail(String(to))) {
    throw new ApiError('valid recipient email (to) is required', 400);
  }

  if (!subject || String(subject).trim().length < 2) {
    throw new ApiError('subject is required', 400);
  }

  if (!message || String(message).trim().length < 2) {
    throw new ApiError('message is required', 400);
  }

  try {
    const { attempts } = await executeWithRetry(
      () => sendEmail({ to: String(to).trim(), subject: String(subject).trim(), message: String(message).trim() }),
      { retries: 3, delayMs: 350 }
    );

    const notification = await logNotification({
      userId,
      message: String(message).trim(),
      type: 'EMAIL',
      status: 'SENT',
      recipient: String(to).trim(),
      subject: String(subject).trim(),
      eventType: eventType ? String(eventType).trim() : '',
      retryCount: attempts - 1
    });

    return res.status(200).json({
      success: true,
      message: 'Email notification sent successfully',
      notification
    });
  } catch (error) {
    const attempts = error.attempts || 3;

    const notification = await logNotification({
      userId,
      message: String(message).trim(),
      type: 'EMAIL',
      status: 'FAILED',
      recipient: String(to).trim(),
      subject: String(subject).trim(),
      eventType: eventType ? String(eventType).trim() : '',
      retryCount: attempts,
      lastError: error.message
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to send email notification after retries',
      notification
    });
  }
});

const sendSmsNotification = asyncHandler(async (req, res) => {
  const { userId, to, message, eventType } = req.body;

  validateUserId(userId);

  if (!to || String(to).trim().length < 6) {
    throw new ApiError('valid recipient phone number (to) is required', 400);
  }

  if (!message || String(message).trim().length < 2) {
    throw new ApiError('message is required', 400);
  }

  try {
    const { attempts } = await executeWithRetry(
      () => sendSms({ to: String(to).trim(), message: String(message).trim() }),
      { retries: 3, delayMs: 250 }
    );

    const notification = await logNotification({
      userId,
      message: String(message).trim(),
      type: 'SMS',
      status: 'SENT',
      recipient: String(to).trim(),
      eventType: eventType ? String(eventType).trim() : '',
      retryCount: attempts - 1
    });

    return res.status(200).json({
      success: true,
      message: 'SMS notification sent successfully',
      notification
    });
  } catch (error) {
    const attempts = error.attempts || 3;

    const notification = await logNotification({
      userId,
      message: String(message).trim(),
      type: 'SMS',
      status: 'FAILED',
      recipient: String(to).trim(),
      eventType: eventType ? String(eventType).trim() : '',
      retryCount: attempts,
      lastError: error.message
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to send SMS notification after retries',
      notification
    });
  }
});

const notifyAppointmentEvent = asyncHandler(async (req, res) => {
  const { type, userId, patientId, doctorId, message, metadata, recipients } = req.body;

  if (!type || !['APPOINTMENT_BOOKED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_COMPLETED'].includes(type)) {
    throw new ApiError('type must be APPOINTMENT_BOOKED, APPOINTMENT_CANCELLED or APPOINTMENT_COMPLETED', 400);
  }

  const finalMessage = message || `${type.replaceAll('_', ' ')} notification`;
  const recipientList = normalizeRecipients(recipients);

  if (recipientList.length === 0) {
    const targetUserId = userId || patientId || doctorId;
    validateUserId(targetUserId);

    recipientList.push({
      userId: targetUserId,
      role: '',
      name: '',
      email: metadata?.email || '',
      phone: metadata?.phone || ''
    });
  }

  const delivery = [];

  for (const recipient of recipientList) {
    if (recipient.email && isValidEmail(String(recipient.email))) {
      try {
        const emailResult = await executeWithRetry(
          () =>
            sendEmail({
              to: String(recipient.email).trim(),
              subject: `Smart Healthcare: ${type.replaceAll('_', ' ')}`,
              message: String(finalMessage).trim()
            }),
          { retries: 2, delayMs: 300 }
        );

        const logged = await logNotification({
          userId: recipient.userId,
          message: String(finalMessage).trim(),
          type: 'EMAIL',
          status: 'SENT',
          recipient: String(recipient.email).trim(),
          subject: `Smart Healthcare: ${type.replaceAll('_', ' ')}`,
          eventType: type,
          retryCount: Math.max(0, (emailResult.attempts || 1) - 1)
        });

        delivery.push({
          channel: 'EMAIL',
          userId: recipient.userId,
          status: 'SENT',
          recipient: recipient.email,
          notificationId: logged._id,
          previewUrl: emailResult.result?.previewUrl || ''
        });
      } catch (error) {
        const logged = await logNotification({
          userId: recipient.userId,
          message: String(finalMessage).trim(),
          type: 'EMAIL',
          status: 'FAILED',
          recipient: String(recipient.email).trim(),
          subject: `Smart Healthcare: ${type.replaceAll('_', ' ')}`,
          eventType: type,
          retryCount: error.attempts || 2,
          lastError: error.message
        });

        delivery.push({
          channel: 'EMAIL',
          userId: recipient.userId,
          status: 'FAILED',
          recipient: recipient.email,
          notificationId: logged._id,
          error: error.message
        });
      }
    }

    if (recipient.phone && String(recipient.phone).trim().length >= 6) {
      try {
        const smsResult = await executeWithRetry(
          () => sendSms({ to: String(recipient.phone).trim(), message: String(finalMessage).trim() }),
          { retries: 2, delayMs: 200 }
        );

        const logged = await logNotification({
          userId: recipient.userId,
          message: String(finalMessage).trim(),
          type: 'SMS',
          status: 'SENT',
          recipient: String(recipient.phone).trim(),
          eventType: type,
          retryCount: Math.max(0, (smsResult.attempts || 1) - 1)
        });

        delivery.push({
          channel: 'SMS',
          userId: recipient.userId,
          status: 'SENT',
          recipient: recipient.phone,
          notificationId: logged._id,
          whatsappLink: smsResult.result?.whatsappLink || '',
          smsLink: smsResult.result?.smsLink || ''
        });
      } catch (error) {
        const logged = await logNotification({
          userId: recipient.userId,
          message: String(finalMessage).trim(),
          type: 'SMS',
          status: 'FAILED',
          recipient: String(recipient.phone).trim(),
          eventType: type,
          retryCount: error.attempts || 2,
          lastError: error.message
        });

        delivery.push({
          channel: 'SMS',
          userId: recipient.userId,
          status: 'FAILED',
          recipient: recipient.phone,
          notificationId: logged._id,
          error: error.message
        });
      }
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Appointment event notifications processed',
    delivery
  });
});

module.exports = {
  sendEmailNotification,
  sendSmsNotification,
  notifyAppointmentEvent
};
