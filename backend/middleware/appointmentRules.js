import Appointment from '../models/Appointment.js';

// Check if appointment can be modified (48h rule)
export const checkEditable = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Store appointment in request for later use
    req.appointment = appointment;

    // Kine and admin can always modify
    if (req.user.role === 'kine' || req.user.role === 'admin') {
      return next();
    }

    // Calculate hours until appointment
    const now = new Date();
    const appointmentDate = new Date(appointment.date);
    const diffHours = (appointmentDate - now) / (1000 * 60 * 60);

    // Patient can only modify if more than 48h before appointment
    if (diffHours < 48 && req.user.role === 'patient') {
      return res.status(403).json({ 
        message: 'Modification impossible à moins de 48h avant le rendez-vous',
        hoursRemaining: Math.round(diffHours * 10) / 10
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error checking appointment editability', error: error.message });
  }
};

// Check if user owns the appointment or is authorized
export const checkAppointmentOwnership = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    req.appointment = appointment;

    // Admin can access all appointments
    if (req.user.role === 'admin') {
      return next();
    }

    // Kine can access their own appointments
    if (req.user.role === 'kine' && appointment.kine.toString() === req.user._id.toString()) {
      return next();
    }

    // Patient can access their own appointments
    if (req.user.role === 'patient' && appointment.patient && 
        appointment.patient.toString() === req.user._id.toString()) {
      return next();
    }

    return res.status(403).json({ message: 'Access denied to this appointment' });
  } catch (error) {
    return res.status(500).json({ message: 'Error checking appointment ownership', error: error.message });
  }
};
