import twilio from 'twilio';
import Notification from '../models/Notification.js';

// Initialize Twilio client
let twilioClient = null;

const getTwilioClient = () => {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return twilioClient;
};

// Send SMS
export const sendSMS = async ({ to, message, appointmentId, userId }) => {
  try {
    const client = getTwilioClient();

    if (!client) {
      throw new Error('Twilio not configured');
    }

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });

    // Log notification
    await Notification.create({
      user: userId,
      recipient: { phone: to },
      message,
      type: 'sms',
      status: 'sent',
      appointment: appointmentId,
      metadata: {
        provider: 'twilio',
        messageId: result.sid,
      },
    });

    console.log('✅ SMS sent:', result.sid);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('❌ SMS error:', error);

    // Log failed notification
    await Notification.create({
      user: userId,
      recipient: { phone: to },
      message,
      type: 'sms',
      status: 'failed',
      appointment: appointmentId,
      metadata: {
        provider: 'twilio',
        error: error.message,
      },
    });

    throw error;
  }
};

// Send WhatsApp message
export const sendWhatsApp = async ({ to, message, appointmentId, userId }) => {
  try {
    const client = getTwilioClient();

    if (!client) {
      throw new Error('Twilio not configured');
    }

    // Format phone number for WhatsApp
    const whatsappNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: whatsappNumber,
    });

    // Log notification
    await Notification.create({
      user: userId,
      recipient: { phone: to },
      message,
      type: 'whatsapp',
      status: 'sent',
      appointment: appointmentId,
      metadata: {
        provider: 'twilio',
        messageId: result.sid,
      },
    });

    console.log('✅ WhatsApp message sent:', result.sid);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('❌ WhatsApp error:', error);

    // Log failed notification
    await Notification.create({
      user: userId,
      recipient: { phone: to },
      message,
      type: 'whatsapp',
      status: 'failed',
      appointment: appointmentId,
      metadata: {
        provider: 'twilio',
        error: error.message,
      },
    });

    throw error;
  }
};

// SMS/WhatsApp templates
export const smsTemplates = {
  appointmentConfirmed: (appointment, patientName, kineName) => 
    `✅ KinéVerse: Votre RDV avec ${kineName} est confirmé le ${new Date(appointment.date).toLocaleDateString('fr-FR')} à ${new Date(appointment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. Annulation possible jusqu'à 48h avant.`,

  appointmentPending: (appointment, kineName) =>
    `⏳ KinéVerse: Votre demande de RDV avec ${kineName} pour le ${new Date(appointment.date).toLocaleDateString('fr-FR')} est en attente de confirmation.`,

  appointmentReminder: (appointment, kineName) =>
    `🔔 KinéVerse: Rappel - RDV demain avec ${kineName} à ${new Date(appointment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. À bientôt!`,

  newAppointmentKine: (appointment, patientName) =>
    `📅 KinéVerse: Nouvelle demande de RDV de ${patientName} pour ${appointment.service} le ${new Date(appointment.date).toLocaleDateString('fr-FR')} à ${new Date(appointment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. Veuillez confirmer.`,

  appointmentCancelled: (appointment, kineName) =>
    `❌ KinéVerse: Votre RDV du ${new Date(appointment.date).toLocaleDateString('fr-FR')} avec ${kineName} a été annulé.`,
};
