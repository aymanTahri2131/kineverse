import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recipient: {
    email: String,
    phone: String,
    name: String
  },
  message: {
    type: String,
    required: true
  },
  subject: String,
  type: {
    type: String,
    enum: ['email', 'sms', 'whatsapp', 'system'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  metadata: {
    provider: String,
    messageId: String,
    error: String
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
NotificationSchema.index({ user: 1, sentAt: -1 });
NotificationSchema.index({ appointment: 1 });
NotificationSchema.index({ status: 1 });

export default mongoose.model('Notification', NotificationSchema);
