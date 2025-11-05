import nodemailer from 'nodemailer';
import Notification from '../models/Notification.js';

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send email
export const sendEmail = async ({ to, subject, html, text, appointmentId, userId }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    // Log notification
    await Notification.create({
      user: userId,
      recipient: { email: to },
      message: text || html,
      subject,
      type: 'email',
      status: 'sent',
      appointment: appointmentId,
      metadata: {
        provider: 'nodemailer',
        messageId: info.messageId,
      },
    });

    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email error:', error);

    // Log failed notification
    await Notification.create({
      user: userId,
      recipient: { email: to },
      message: text || html,
      subject,
      type: 'email',
      status: 'failed',
      appointment: appointmentId,
      metadata: {
        provider: 'nodemailer',
        error: error.message,
      },
    });

    throw error;
  }
};

// Email templates
export const emailTemplates = {
  appointmentConfirmation: (appointment, patientInfo, kineInfo) => ({
    subject: '✅ Rendez-vous confirmé - KinéVerse',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Rendez-vous Confirmé</h2>
        <p>Bonjour ${patientInfo.name},</p>
        <p>Votre rendez-vous a été confirmé avec succès !</p>
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Service:</strong> ${appointment.service}</p>
          ${appointment.subservice ? `<p><strong>Sous-service:</strong> ${appointment.subservice}</p>` : ''}
          <p><strong>Kinésithérapeute:</strong> ${kineInfo.name}</p>
          <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}</p>
          <p><strong>Heure:</strong> ${new Date(appointment.date).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}</p>
          <p><strong>Durée:</strong> ${appointment.durationMinutes} minutes</p>
        </div>
        <p style="color: #6B7280; font-size: 14px;">
          Vous pouvez modifier ou annuler ce rendez-vous jusqu'à 48h avant la date prévue.
        </p>
        <p>À bientôt,<br>L'équipe KinéVerse</p>
      </div>
    `,
    text: `Rendez-vous confirmé\n\nBonjour ${patientInfo.name},\n\nVotre rendez-vous avec ${kineInfo.name} pour ${appointment.service} est confirmé le ${new Date(appointment.date).toLocaleDateString('fr-FR')} à ${new Date(appointment.date).toLocaleTimeString('fr-FR')}.`,
  }),

  appointmentPending: (appointment, patientInfo, kineInfo) => ({
    subject: '⏳ Nouveau rendez-vous en attente - KinéVerse',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F59E0B;">Rendez-vous en Attente de Confirmation</h2>
        <p>Bonjour ${patientInfo.name},</p>
        <p>Votre demande de rendez-vous a été enregistrée et est en attente de confirmation.</p>
        <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Service:</strong> ${appointment.service}</p>
          <p><strong>Kinésithérapeute:</strong> ${kineInfo.name}</p>
          <p><strong>Date demandée:</strong> ${new Date(appointment.date).toLocaleDateString('fr-FR')} à ${new Date(appointment.date).toLocaleTimeString('fr-FR')}</p>
        </div>
        <p>Vous recevrez une notification dès que votre rendez-vous sera confirmé.</p>
        <p>Cordialement,<br>L'équipe KinéVerse</p>
      </div>
    `,
    text: `Rendez-vous en attente\n\nVotre demande de rendez-vous avec ${kineInfo.name} pour le ${new Date(appointment.date).toLocaleDateString('fr-FR')} est en attente de confirmation.`,
  }),

  appointmentReminder: (appointment, patientInfo, kineInfo) => ({
    subject: '🔔 Rappel - Rendez-vous demain - KinéVerse',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Rappel de Rendez-vous</h2>
        <p>Bonjour ${patientInfo.name},</p>
        <p>Nous vous rappelons votre rendez-vous de demain :</p>
        <div style="background-color: #D1FAE5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Service:</strong> ${appointment.service}</p>
          <p><strong>Kinésithérapeute:</strong> ${kineInfo.name}</p>
          <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString('fr-FR')}</p>
          <p><strong>Heure:</strong> ${new Date(appointment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <p>Nous vous attendons !</p>
        <p>L'équipe KinéVerse</p>
      </div>
    `,
    text: `Rappel: Rendez-vous demain avec ${kineInfo.name} à ${new Date(appointment.date).toLocaleTimeString('fr-FR')}.`,
  }),

  newAppointmentKine: (appointment, patientInfo) => ({
    subject: '📅 Nouvelle demande de rendez-vous - KinéVerse',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Nouvelle Demande de Rendez-vous</h2>
        <p>Une nouvelle demande de rendez-vous nécessite votre attention :</p>
        <div style="background-color: #EEF2FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Patient:</strong> ${patientInfo.name}</p>
          <p><strong>Téléphone:</strong> ${patientInfo.phone}</p>
          ${patientInfo.email ? `<p><strong>Email:</strong> ${patientInfo.email}</p>` : ''}
          <p><strong>Service:</strong> ${appointment.service}</p>
          ${appointment.subservice ? `<p><strong>Sous-service:</strong> ${appointment.subservice}</p>` : ''}
          <p><strong>Date demandée:</strong> ${new Date(appointment.date).toLocaleDateString('fr-FR')} à ${new Date(appointment.date).toLocaleTimeString('fr-FR')}</p>
          ${appointment.notes ? `<p><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
        </div>
        <p>Veuillez vous connecter à votre tableau de bord pour confirmer ou modifier ce rendez-vous.</p>
      </div>
    `,
    text: `Nouvelle demande de RDV: ${patientInfo.name} pour ${appointment.service} le ${new Date(appointment.date).toLocaleDateString('fr-FR')}.`,
  }),
};
