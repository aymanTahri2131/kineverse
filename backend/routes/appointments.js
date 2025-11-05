import express from 'express';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { checkEditable, checkAppointmentOwnership } from '../middleware/appointmentRules.js';
import { notifyAppointmentCreated, notifyAppointmentConfirmed, notifyAppointmentCancelled } from '../services/notificationService.js';
import { upload, uploadToCloudinary } from '../config/cloudinary.js';

const router = express.Router();

// @route   POST /api/appointments/upload-certificate
// @desc    Upload medical certificate to Cloudinary
// @access  Public
router.post('/upload-certificate', upload.single('certificate'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        message: 'Aucun fichier fourni',
        error: 'NO_FILE' 
      });
    }

    // Upload vers Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.status(200).json({
      message: 'Fichier uploadé avec succès',
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'upload du fichier',
      error: error.message 
    });
  }
});

// @route   POST /api/appointments
// @desc    Create appointment (guest or authenticated user)
// @access  Public (with optional auth)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { kine, service, subservice, date, durationMinutes, notes, guestInfo, attachment } = req.body;

    // Validation
    if (!service || !date) {
      return res.status(400).json({ 
        message: 'Please provide service and date' 
      });
    }

    // Parse the requested date/time
    const requestedDate = new Date(date);
    
    // Check if appointment date is in the future
    const now = new Date();
    if (requestedDate < now) {
      return res.status(400).json({ 
        message: 'Cannot book appointments in the past' 
      });
    }

    // CRITICAL: Check if slot is available (regardless of kine)
    // A slot is the exact date/time (30-minute intervals)
    const existingAppointment = await Appointment.findOne({
      date: requestedDate,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      return res.status(400).json({ 
        message: 'This time slot is already booked. Please choose another time.',
        isSlotTaken: true
      });
    }

    // Kine will be assigned later (by kine themselves or by admin)
    // If kine is provided, verify it exists
    let kineUser = null;
    if (kine) {
      kineUser = await User.findById(kine);
      if (!kineUser || kineUser.role !== 'kine') {
        return res.status(404).json({ message: 'Kine not found' });
      }
    }

    // Prepare appointment data
    const appointmentData = {
      kine: kineUser ? kineUser._id : null, // null if no kine specified
      service,
      subservice,
      date,
      durationMinutes: durationMinutes || 45,
      notes,
      status: 'pending',
    };

    // Add attachment if provided
    if (attachment && attachment.url) {
      appointmentData.attachment = {
        url: attachment.url,
        publicId: attachment.publicId
      };
    }

    // Add patient or guest info
    // If admin provides a patientId, use it (admin booking for a patient)
    const { patientId } = req.body;
    
    if (req.user && req.user.role === 'admin' && patientId) {
      // Admin creating appointment for a specific patient
      const patient = await User.findById(patientId);
      if (!patient || patient.role !== 'patient') {
        return res.status(404).json({ message: 'Patient not found' });
      }
      appointmentData.patient = patientId;
    } else if (req.user && req.user.role === 'patient') {
      // Patient booking for themselves
      appointmentData.patient = req.user._id;
    } else {
      // Guest booking (including kine creating appointments) - require guest info
      if (!guestInfo || !guestInfo.name || !guestInfo.phone) {
        return res.status(400).json({ 
          message: 'Guest bookings require name and phone number' 
        });
      }
      appointmentData.guestInfo = guestInfo;
    }

    // Create appointment
    const appointment = await Appointment.create(appointmentData);
    if (appointment.kine) {
      await appointment.populate('kine', 'name email phone specialty');
    }

    // Prepare notification info
    const patientInfo = req.user ? {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
    } : guestInfo;

    // Send notifications only if kine is assigned
    if (kineUser) {
      const kineInfo = {
        id: kineUser._id,
        name: kineUser.name,
        email: kineUser.email,
        phone: kineUser.phone,
      };

      try {
        await notifyAppointmentCreated(appointment, patientInfo, kineInfo);
      } catch (notifError) {
        console.error('Notification error:', notifError);
        // Continue even if notifications fail
      }
    }

    res.status(201).json({
      message: 'Appointment created successfully. A kinesiotherapist will be assigned soon.',
      appointment,
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ 
      message: 'Error creating appointment', 
      error: error.message 
    });
  }
});

// @route   GET /api/appointments/available
// @desc    Get all available appointments (no kine assigned) - for kines to pick
// @access  Private (kine/admin)
router.get('/available', authenticate, authorize('kine', 'admin'), async (req, res) => {
  try {
    // Find all appointments without a kine assigned and status pending
    const availableAppointments = await Appointment.find({
      kine: null,
      status: 'pending',
      date: { $gte: new Date() } // Only future appointments
    })
      .populate('patient', 'name email phone')
      .sort({ date: 1 }) // Sort by date ascending
      .lean();

    res.json({
      count: availableAppointments.length,
      appointments: availableAppointments,
    });
  } catch (error) {
    console.error('Get available appointments error:', error);
    res.status(500).json({ 
      message: 'Error fetching available appointments', 
      error: error.message 
    });
  }
});

// @route   GET /api/appointments/booked-slots
// @desc    Get all booked time slots (for frontend slot checking)
// @access  Public
router.get('/booked-slots', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to next 15 days if not specified
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    // Get all booked appointments in date range (excluding cancelled)
    const bookedAppointments = await Appointment.find({
      date: {
        $gte: start,
        $lte: end
      },
      status: { $ne: 'cancelled' }
    }).select('date status').lean();

    // Return simplified data (just dates and status)
    res.json({
      bookedSlots: bookedAppointments.map(apt => ({
        date: apt.date,
        status: apt.status,
        isBooked: true
      }))
    });
  } catch (error) {
    console.error('Get booked slots error:', error);
    res.status(500).json({ 
      message: 'Error fetching booked slots', 
      error: error.message 
    });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get single appointment
// @access  Private (owner or kine or admin)
router.get('/:id', authenticate, checkAppointmentOwnership, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('kine', 'name email phone specialty');

    res.json({ appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ 
      message: 'Error fetching appointment', 
      error: error.message 
    });
  }
});

// @route   GET /api/appointments/user/:userId
// @desc    Get all appointments for a user
// @access  Private
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, startDate, endDate } = req.query;

    // Only allow users to see their own appointments (or admin)
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = {};

    // Build query based on role
    if (req.user.role === 'patient') {
      query.patient = userId;
    } else if (req.user.role === 'kine') {
      query.kine = userId;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('kine', 'name email phone specialty')
      .sort({ date: -1 });

    res.json({ 
      count: appointments.length,
      appointments 
    });
  } catch (error) {
    console.error('Get user appointments error:', error);
    res.status(500).json({ 
      message: 'Error fetching appointments', 
      error: error.message 
    });
  }
});

// @route   GET /api/appointments
// @desc    Get all appointments (public for slot checking, with limited info)
// @access  Public (with optional auth for detailed info)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, kineId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = {};

    // If authenticated and is kine, show only their appointments
    if (req.user && req.user.role === 'kine') {
      query.kine = req.user._id;
    } else if (kineId) {
      query.kine = kineId;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('patient', 'name email phone')
        .populate('kine', 'name email phone specialty')
        .sort({ date: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Appointment.countDocuments(query),
    ]);

    // If not authenticated or not admin/kine, return limited public info (just for slot checking)
    let responseAppointments = appointments;
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'kine')) {
      responseAppointments = appointments.map(apt => ({
        _id: apt._id,
        date: apt.date,
        status: apt.status,
        service: apt.service,
        // Don't expose patient/kine details to public
      }));
    }

    res.json({
      appointments: responseAppointments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ 
      message: 'Error fetching appointments', 
      error: error.message 
    });
  }
});

// @route   PUT /api/appointments/:id
// @desc    Update appointment (with 48h rule for patients)
// @access  Private
router.put('/:id', authenticate, checkAppointmentOwnership, checkEditable, async (req, res) => {
  try {
    const { date, service, subservice, notes } = req.body;
    const appointment = req.appointment;

    const updates = {};
    const oldDate = appointment.date;

    if (date) {
      // Check if new date is in the future
      if (new Date(date) < new Date()) {
        return res.status(400).json({ 
          message: 'Cannot set appointment date in the past' 
        });
      }
      updates.date = date;
      // If patient modifies date, set status to awaiting_reconfirmation
      if (req.user.role === 'patient') {
        updates.status = 'awaiting_reconfirmation';
      }
    }

    if (service) updates.service = service;
    if (subservice !== undefined) updates.subservice = subservice;
    if (notes !== undefined) updates.notes = notes;

    // Add to modification history
    if (date && date !== oldDate.toISOString()) {
      appointment.modificationHistory.push({
        modifiedAt: new Date(),
        modifiedBy: req.user._id,
        previousDate: oldDate,
        newDate: date,
        reason: req.body.reason || 'Date modified',
      });
    }

    // Update appointment
    Object.assign(appointment, updates);
    await appointment.save();
    await appointment.populate('patient kine');

    res.json({
      message: 'Appointment updated successfully',
      appointment,
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ 
      message: 'Error updating appointment', 
      error: error.message 
    });
  }
});

// @route   POST /api/appointments/:id/take
// @desc    Take/Accept an unassigned appointment (kine only)
// @access  Private (kine)
router.post('/:id/take', authenticate, authorize('kine'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('kine', 'name email phone specialty');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if appointment already has a kine assigned
    if (appointment.kine) {
      return res.status(400).json({ 
        message: 'This appointment is already assigned to another kinesiotherapist' 
      });
    }

    // Check if appointment is still pending
    if (appointment.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Only pending appointments can be taken' 
      });
    }

    // Assign the kine to this appointment
    appointment.kine = req.user._id;
    await appointment.save();
    await appointment.populate('kine', 'name email phone specialty');

    // Prepare notification info
    const patientInfo = appointment.patient ? {
      id: appointment.patient._id,
      name: appointment.patient.name,
      email: appointment.patient.email,
      phone: appointment.patient.phone,
    } : appointment.guestInfo;

    const kineInfo = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
    };

    // Send notification
    try {
      await notifyAppointmentCreated(appointment, patientInfo, kineInfo);
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.json({
      message: 'Appointment successfully assigned to you',
      appointment,
    });
  } catch (error) {
    console.error('Take appointment error:', error);
    res.status(500).json({ 
      message: 'Error taking appointment', 
      error: error.message 
    });
  }
});

// @route   POST /api/appointments/:id/confirm
// @desc    Confirm appointment (kine only)
// @access  Private (kine/admin)
router.post('/:id/confirm', authenticate, authorize('kine', 'admin'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('kine', 'name email phone specialty');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Kine can only confirm their own appointments
    if (req.user.role === 'kine' && appointment.kine._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    appointment.status = 'confirmed';
    await appointment.save();

    // Prepare patient info
    const patientInfo = appointment.patient ? {
      id: appointment.patient._id,
      name: appointment.patient.name,
      email: appointment.patient.email,
      phone: appointment.patient.phone,
    } : appointment.guestInfo;

    const kineInfo = {
      id: appointment.kine._id,
      name: appointment.kine.name,
      email: appointment.kine.email,
      phone: appointment.kine.phone,
    };

    // Send confirmation notification
    try {
      await notifyAppointmentConfirmed(appointment, patientInfo, kineInfo);
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.json({
      message: 'Appointment confirmed',
      appointment,
    });
  } catch (error) {
    console.error('Confirm appointment error:', error);
    res.status(500).json({ 
      message: 'Error confirming appointment', 
      error: error.message 
    });
  }
});

// @route   POST /api/appointments/:id/reject
// @desc    Reject appointment (kine only)
// @access  Private (kine/admin)
router.post('/:id/reject', authenticate, authorize('kine', 'admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient kine');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Kine can only reject their own appointments
    if (req.user.role === 'kine' && appointment.kine._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    appointment.status = 'rejected';
    appointment.cancellationReason = reason;
    await appointment.save();

    res.json({
      message: 'Appointment rejected',
      appointment,
    });
  } catch (error) {
    console.error('Reject appointment error:', error);
    res.status(500).json({ 
      message: 'Error rejecting appointment', 
      error: error.message 
    });
  }
});

// @route   POST /api/appointments/:id/cancel
// @desc    Cancel appointment
// @access  Private
router.post('/:id/cancel', authenticate, checkAppointmentOwnership, async (req, res) => {
  try {
    const { reason } = req.body;
    const appointment = req.appointment;

    await appointment.populate('patient kine');

    appointment.status = 'cancelled';
    appointment.cancellationReason = reason;
    await appointment.save();

    // Send cancellation notification if patient cancels
    if (req.user.role === 'patient') {
      const patientInfo = {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
      };

      const kineInfo = {
        id: appointment.kine._id,
        name: appointment.kine.name,
        email: appointment.kine.email,
        phone: appointment.kine.phone,
      };

      try {
        await notifyAppointmentCancelled(appointment, patientInfo, kineInfo);
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }
    }

    res.json({
      message: 'Appointment cancelled',
      appointment,
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ 
      message: 'Error cancelling appointment', 
      error: error.message 
    });
  }
});

// @route   POST /api/appointments/:id/payment
// @desc    Mark payment as paid (kine only)
// @access  Private (kine/admin)
router.post('/:id/payment', authenticate, authorize('kine', 'admin'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Kine can only mark payment for their own appointments
    if (req.user.role === 'kine' && appointment.kine.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    appointment.paymentStatus = 'paid';
    appointment.status = 'done';
    await appointment.save();

    res.json({
      message: 'Payment marked as paid',
      appointment,
    });
  } catch (error) {
    console.error('Payment update error:', error);
    res.status(500).json({ 
      message: 'Error updating payment status', 
      error: error.message 
    });
  }
});

// @route   PATCH /api/appointments/:id/assign-kine
// @desc    Assign kinesiotherapist to appointment (admin only)
// @access  Private (admin)
router.patch('/:id/assign-kine', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { kineId } = req.body;

    if (!kineId) {
      return res.status(400).json({ message: 'Kine ID is required' });
    }

    // Verify kine exists and has correct role
    const kine = await User.findById(kineId);
    if (!kine || kine.role !== 'kine') {
      return res.status(404).json({ message: 'Kine not found' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.kine = kineId;
    await appointment.save();
    await appointment.populate('kine', 'name email phone specialty');

    res.json({
      message: 'Kine assigned successfully',
      appointment,
    });
  } catch (error) {
    console.error('Assign kine error:', error);
    res.status(500).json({ 
      message: 'Error assigning kine', 
      error: error.message 
    });
  }
});

// @route   PATCH /api/appointments/:id
// @desc    Update appointment status (admin only)
// @access  Private (admin)
router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, date } = req.body;

    // Validate that at least one field is provided
    if (!status && !date) {
      return res.status(400).json({ message: 'Status or date is required' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Update status if provided
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'done', 'cancelled', 'rejected', 'awaiting_reconfirmation'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      appointment.status = status;
    }

    // Update date if provided
    if (date) {
      const requestedDate = new Date(date);
      
      // Check if the new date is in the future (optional validation)
      const now = new Date();
      if (requestedDate < now) {
        return res.status(400).json({ 
          message: 'Cannot set appointment date in the past' 
        });
      }

      // Check if the new time slot is available (excluding current appointment)
      const existingAppointment = await Appointment.findOne({
        date: requestedDate,
        status: { $ne: 'cancelled' },
        _id: { $ne: appointment._id } // Exclude current appointment
      });

      if (existingAppointment) {
        return res.status(400).json({ 
          message: 'This time slot is already booked',
          isSlotTaken: true
        });
      }

      appointment.date = requestedDate;
    }

    await appointment.save();
    await appointment.populate('patient kine');

    res.json({
      message: date ? 'Appointment updated successfully' : 'Appointment status updated successfully',
      appointment,
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ 
      message: 'Error updating appointment', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Delete appointment (admin only)
// @access  Private (admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ 
      message: 'Error deleting appointment', 
      error: error.message 
    });
  }
});

export default router;
