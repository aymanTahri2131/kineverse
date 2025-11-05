import { sendEmail, emailTemplates } from './emailService.js';
import { sendSMS, sendWhatsApp, smsTemplates } from './smsService.js';

// Send all notifications (email + SMS + WhatsApp)
export const sendAppointmentNotification = async ({
  type,
  appointment,
  patientInfo,
  kineInfo,
  recipient = 'patient' // 'patient' or 'kine'
}) => {
  const results = {
    email: { sent: false },
    sms: { sent: false },
    whatsapp: { sent: false },
  };

  const targetInfo = recipient === 'patient' ? patientInfo : kineInfo;
  const userId = targetInfo.id || null;
  const appointmentId = appointment._id || appointment.id;

  // Determine which template to use
  let emailTemplate, smsMessage;

  switch (type) {
    case 'confirmed':
      if (recipient === 'patient') {
        emailTemplate = emailTemplates.appointmentConfirmation(appointment, patientInfo, kineInfo);
        smsMessage = smsTemplates.appointmentConfirmed(appointment, patientInfo.name, kineInfo.name);
      }
      break;

    case 'pending':
      if (recipient === 'patient') {
        emailTemplate = emailTemplates.appointmentPending(appointment, patientInfo, kineInfo);
        smsMessage = smsTemplates.appointmentPending(appointment, kineInfo.name);
      } else {
        emailTemplate = emailTemplates.newAppointmentKine(appointment, patientInfo);
        smsMessage = smsTemplates.newAppointmentKine(appointment, patientInfo.name);
      }
      break;

    case 'reminder':
      emailTemplate = emailTemplates.appointmentReminder(appointment, patientInfo, kineInfo);
      smsMessage = smsTemplates.appointmentReminder(appointment, kineInfo.name);
      break;

    case 'cancelled':
      smsMessage = smsTemplates.appointmentCancelled(appointment, kineInfo.name);
      break;

    default:
      console.error('Unknown notification type:', type);
      return results;
  }

  // Send Email
  if (targetInfo.email && emailTemplate) {
    try {
      await sendEmail({
        to: targetInfo.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
        appointmentId,
        userId,
      });
      results.email.sent = true;
    } catch (error) {
      console.error('Email notification failed:', error.message);
      results.email.error = error.message;
    }
  }

  // Send SMS
  if (targetInfo.phone && smsMessage) {
    try {
      await sendSMS({
        to: targetInfo.phone,
        message: smsMessage,
        appointmentId,
        userId,
      });
      results.sms.sent = true;
    } catch (error) {
      console.error('SMS notification failed:', error.message);
      results.sms.error = error.message;
    }
  }

  // Send WhatsApp (optional, can be enabled/disabled)
  if (targetInfo.phone && smsMessage && process.env.ENABLE_WHATSAPP === 'true') {
    try {
      await sendWhatsApp({
        to: targetInfo.phone,
        message: smsMessage,
        appointmentId,
        userId,
      });
      results.whatsapp.sent = true;
    } catch (error) {
      console.error('WhatsApp notification failed:', error.message);
      results.whatsapp.error = error.message;
    }
  }

  return results;
};

// Send notification to both patient and kine
export const notifyAppointmentCreated = async (appointment, patientInfo, kineInfo) => {
  const results = {};

  // Notify patient
  results.patient = await sendAppointmentNotification({
    type: 'pending',
    appointment,
    patientInfo,
    kineInfo,
    recipient: 'patient',
  });

  // Notify kine
  results.kine = await sendAppointmentNotification({
    type: 'pending',
    appointment,
    patientInfo,
    kineInfo,
    recipient: 'kine',
  });

  return results;
};

// Send confirmation notification
export const notifyAppointmentConfirmed = async (appointment, patientInfo, kineInfo) => {
  return await sendAppointmentNotification({
    type: 'confirmed',
    appointment,
    patientInfo,
    kineInfo,
    recipient: 'patient',
  });
};

// Send reminder 24h before
export const notifyAppointmentReminder = async (appointment, patientInfo, kineInfo) => {
  return await sendAppointmentNotification({
    type: 'reminder',
    appointment,
    patientInfo,
    kineInfo,
    recipient: 'patient',
  });
};

// Send cancellation notification
export const notifyAppointmentCancelled = async (appointment, patientInfo, kineInfo) => {
  return await sendAppointmentNotification({
    type: 'cancelled',
    appointment,
    patientInfo,
    kineInfo,
    recipient: 'patient',
  });
};
