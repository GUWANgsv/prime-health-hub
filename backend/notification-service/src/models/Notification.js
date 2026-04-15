const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    type: {
      type: String,
      enum: ['EMAIL', 'SMS'],
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING'
    },
    recipient: {
      type: String,
      required: true,
      trim: true
    },
    subject: {
      type: String,
      trim: true,
      default: ''
    },
    eventType: {
      type: String,
      trim: true,
      default: ''
    },
    retryCount: {
      type: Number,
      default: 0
    },
    lastError: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
