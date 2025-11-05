import express from 'express';
import { sendEmail } from '../services/emailService.js';
import { sendSMS, sendWhatsApp } from '../services/smsService.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/notifications/email
// @desc    Send email notification
// @access  Private (admin/kine)
router.post('/email', authenticate, authorize('admin', 'kine'), async (req, res) => {
  try {
    const { to, subject, html, text, appointmentId } = req.body;

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ 
        message: 'Please provide recipient, subject, and message' 
      });
    }

    const result = await sendEmail({
      to,
      subject,
      html,
      text,
      appointmentId,
      userId: req.user._id,
    });

    res.json({
      message: 'Email sent successfully',
      result,
    });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ 
      message: 'Error sending email', 
      error: error.message 
    });
  }
});

// @route   POST /api/notifications/sms
// @desc    Send SMS notification
// @access  Private (admin/kine)
router.post('/sms', authenticate, authorize('admin', 'kine'), async (req, res) => {
  try {
    const { to, message, appointmentId } = req.body;

    if (!to || !message) {
      return res.status(400).json({ 
        message: 'Please provide recipient phone and message' 
      });
    }

    const result = await sendSMS({
      to,
      message,
      appointmentId,
      userId: req.user._id,
    });

    res.json({
      message: 'SMS sent successfully',
      result,
    });
  } catch (error) {
    console.error('Send SMS error:', error);
    res.status(500).json({ 
      message: 'Error sending SMS', 
      error: error.message 
    });
  }
});

// @route   POST /api/notifications/whatsapp
// @desc    Send WhatsApp notification
// @access  Private (admin/kine)
router.post('/whatsapp', authenticate, authorize('admin', 'kine'), async (req, res) => {
  try {
    const { to, message, appointmentId } = req.body;

    if (!to || !message) {
      return res.status(400).json({ 
        message: 'Please provide recipient phone and message' 
      });
    }

    const result = await sendWhatsApp({
      to,
      message,
      appointmentId,
      userId: req.user._id,
    });

    res.json({
      message: 'WhatsApp message sent successfully',
      result,
    });
  } catch (error) {
    console.error('Send WhatsApp error:', error);
    res.status(500).json({ 
      message: 'Error sending WhatsApp message', 
      error: error.message 
    });
  }
});

export default router;
