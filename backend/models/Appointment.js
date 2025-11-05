import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  guestInfo: {
    name: String,
    email: String,
    phone: String
  },
  kine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Admin will assign kine later
  },
  service: {
    type: mongoose.Schema.Types.Mixed, // Allow both string (legacy) and object {fr, ar}
    required: [true, 'Service is required']
  },
  subservice: String,
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  durationMinutes: {
    type: Number,
    default: 45
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'awaiting_reconfirmation', 'done', 'cancelled', 'rejected'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  },
  notes: String,
  cancellationReason: String,
  attachment: {
    url: String,
    publicId: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  modificationHistory: [{
    modifiedAt: Date,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    previousDate: Date,
    newDate: Date,
    reason: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
AppointmentSchema.index({ kine: 1, date: 1 });
AppointmentSchema.index({ patient: 1, date: -1 });
AppointmentSchema.index({ status: 1 });

// Virtual for getting patient info (either linked user or guest)
AppointmentSchema.virtual('patientInfo').get(function() {
  if (this.patient) {
    return {
      id: this.patient._id,
      name: this.patient.name,
      email: this.patient.email,
      phone: this.patient.phone,
      isGuest: false
    };
  } else if (this.guestInfo) {
    return {
      name: this.guestInfo.name,
      email: this.guestInfo.email,
      phone: this.guestInfo.phone,
      isGuest: true
    };
  }
  return null;
});

// Ensure virtuals are included in JSON
AppointmentSchema.set('toJSON', { virtuals: true });
AppointmentSchema.set('toObject', { virtuals: true });

export default mongoose.model('Appointment', AppointmentSchema);
