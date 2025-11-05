import express from 'express';
import Service from '../models/Service.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/services
// @desc    Get all active services
// @access  Public
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ name: 1 });

    res.json({
      count: services.length,
      services,
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ 
      message: 'Error fetching services', 
      error: error.message 
    });
  }
});

// @route   GET /api/services/:id
// @desc    Get single service
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json({ service });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ 
      message: 'Error fetching service', 
      error: error.message 
    });
  }
});

// @route   POST /api/services
// @desc    Create a new service
// @access  Private (admin/kine)
router.post('/', authenticate, authorize('admin', 'kine'), async (req, res) => {
  try {
    const { name, description, subservices, price, durationMinutes, icon } = req.body;

    // Validation
    if (!name || !description || price === undefined) {
      return res.status(400).json({ 
        message: 'Please provide name, description, and price' 
      });
    }

    // Check if service already exists
    const existingService = await Service.findOne({ name });
    if (existingService) {
      return res.status(400).json({ 
        message: 'Service with this name already exists' 
      });
    }

    const service = await Service.create({
      name,
      description,
      subservices: subservices || [],
      price,
      durationMinutes,
      icon,
    });

    res.status(201).json({
      message: 'Service created successfully',
      service,
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ 
      message: 'Error creating service', 
      error: error.message 
    });
  }
});

// @route   PUT /api/services/:id
// @desc    Update a service
// @access  Private (admin/kine)
router.put('/:id', authenticate, authorize('admin', 'kine'), async (req, res) => {
  try {
    const { name, description, subservices, price, durationMinutes, icon, isActive } = req.body;

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Update fields
    if (name !== undefined) service.name = name;
    if (description !== undefined) service.description = description;
    if (subservices !== undefined) service.subservices = subservices;
    if (price !== undefined) service.price = price;
    if (durationMinutes !== undefined) service.durationMinutes = durationMinutes;
    if (icon !== undefined) service.icon = icon;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();

    res.json({
      message: 'Service updated successfully',
      service,
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ 
      message: 'Error updating service', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/services/:id
// @desc    Delete a service (soft delete - set isActive to false)
// @access  Private (admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Soft delete
    service.isActive = false;
    await service.save();

    res.json({ 
      message: 'Service deactivated successfully',
      service,
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ 
      message: 'Error deleting service', 
      error: error.message 
    });
  }
});

export default router;
