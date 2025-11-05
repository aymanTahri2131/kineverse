import express from 'express';
import Contact from '../models/Contact.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        message: 'Please provide name, email, subject, and message' 
      });
    }

    // Email validation
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Please provide a valid email address' 
      });
    }

    // Create contact submission
    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message,
      status: 'new'
    });

    // Send notification email to admin (optional - only if email service is configured)
    try {
      if (process.env.EMAIL_USER && process.env.ADMIN_EMAIL) {
        await sendEmail({
          to: process.env.ADMIN_EMAIL,
          subject: `New Contact Form Submission: ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #00a783;">New Contact Form Submission</h2>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p style="white-space: pre-wrap;">${message}</p>
              </div>
              <p style="color: #666; font-size: 14px;">
                Submitted on: ${new Date().toLocaleString('fr-FR')}
              </p>
            </div>
          `,
          text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
Subject: ${subject}

Message:
${message}

Submitted on: ${new Date().toLocaleString('fr-FR')}
          `
        });
      }
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('Failed to send notification email:', emailError);
    }

    // Send confirmation email to user (optional)
    try {
      if (process.env.EMAIL_USER) {
        await sendEmail({
          to: email,
          subject: 'Nous avons bien reçu votre message - Centre Imane',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #00a783 0%, #009574 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0;">Centre Imane</h1>
                <p style="margin: 10px 0 0;">Kinésithérapie et Physiothérapie</p>
              </div>
              
              <div style="padding: 30px; background: white; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
                <h2 style="color: #242f55; margin-top: 0;">Bonjour ${name},</h2>
                <p style="color: #666; line-height: 1.6;">
                  Nous avons bien reçu votre message concernant "<strong>${subject}</strong>".
                </p>
                <p style="color: #666; line-height: 1.6;">
                  Notre équipe examinera votre demande et vous répondra dans les plus brefs délais, généralement sous 24-48 heures.
                </p>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #666;"><strong>Rappel de votre message :</strong></p>
                  <p style="margin: 10px 0 0; color: #666; white-space: pre-wrap;">${message}</p>
                </div>
                
                <p style="color: #666; line-height: 1.6;">
                  Si vous avez besoin d'une assistance immédiate, n'hésitez pas à nous contacter par téléphone.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                  <p style="color: #999; font-size: 14px; margin: 5px 0;">
                    Cordialement,<br>
                    L'équipe Centre Imane
                  </p>
                </div>
              </div>
            </div>
          `,
          text: `
Bonjour ${name},

Nous avons bien reçu votre message concernant "${subject}".

Notre équipe examinera votre demande et vous répondra dans les plus brefs délais, généralement sous 24-48 heures.

Rappel de votre message :
${message}

Si vous avez besoin d'une assistance immédiate, n'hésitez pas à nous contacter par téléphone.

Cordialement,
L'équipe Centre Imane
          `
        });
      }
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('Failed to send confirmation email:', emailError);
    }

    res.status(201).json({
      message: 'Contact form submitted successfully',
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        createdAt: contact.createdAt
      }
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      message: 'An error occurred while submitting the contact form. Please try again later.' 
    });
  }
});

// @route   GET /api/contact
// @desc    Get all contact submissions (admin only - TODO: add auth)
// @access  Private/Admin
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contact.countDocuments(query);

    res.json({
      contacts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ 
      message: 'An error occurred while fetching contacts' 
    });
  }
});

// @route   PATCH /api/contact/:id
// @desc    Update contact status (admin only - TODO: add auth)
// @access  Private/Admin
router.patch('/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (status === 'replied') updateData.repliedAt = new Date();

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json({
      message: 'Contact updated successfully',
      contact
    });

  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ 
      message: 'An error occurred while updating the contact' 
    });
  }
});

export default router;
