import { Response, NextFunction } from 'express';
import User from '../models/user.model';
import Product from '../models/product.model';
import { NotFoundError, BadRequestError, InternalServerError, ValidationError } from '../utils/custom-errors.util';
import logger from '../utils/logger.util';
import { sanitizeData } from '../utils/sanitize.util';
import templateManager from '../utils/email-templates.util';
import { ConfigService } from '../services/config.service';

export const getAdmins = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');
    logger.info('Admin list retrieved', { userId: req.user?.id, count: admins.length });
    res.json(sanitizeData(admins));
  } catch (error) {
    next(new InternalServerError('Error fetching admins'));
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await User.find().select('-password');
    logger.info('All users list retrieved', { userId: req.user?.id, count: users.length });
    res.json(sanitizeData(users));
  } catch (error) {
    next(new InternalServerError('Error fetching all users'));
  }
};

export const deleteAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedAdmin = await User.findOneAndDelete({ _id: id, role: 'admin' });
    if (!deletedAdmin) {
      throw new NotFoundError('Admin');
    }
    logger.warn('Admin account deleted', { deletedAdminId: id, deletedBy: req.user?.id });
    res.status(204).send();
  } catch (error) {
    next(error instanceof NotFoundError ? error : new InternalServerError('Error deleting admin'));
  }
};

export const addAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
      throw new ValidationError('Username, password, and email are required');
    }

    const newAdmin = new User({
      username,
      email,
      password,
      role: 'admin'
    });
    await newAdmin.save();
    logger.info('New admin account created', { newAdminId: newAdmin._id, createdBy: req.user?.id });

    const { password: _, ...adminWithoutPassword } = newAdmin.toObject();
    res.status(201).json(sanitizeData(adminWithoutPassword));
  } catch (error) {
    next(error instanceof ValidationError ? error : new InternalServerError('Error adding admin'));
  }
};


export const deleteInactiveUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await User.deleteMany({ lastTimeActive: { $lt: thirtyDaysAgo }, role: { $ne: 'admin' } });
    logger.info('Inactive users deleted', { count: result.deletedCount, deletedBy: req.user?.id });
    res.json({ message: `${result.deletedCount} inactive users deleted` });
  } catch (error) {
    next(new InternalServerError('Error deleting inactive users'));
  }
};

export const updateConfiguration = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { config } = req.body;

    // Basic validation
    if (typeof config !== 'object' || config === null) {
      throw new ValidationError('Invalid configuration format');
    }

    // Update the configuration
    const updatedConfig = ConfigService.updateConfiguration(config);

    logger.info('Configuration updated', { 
      updatedBy: req.user?.id, 
      changedFields: Object.keys(config) 
    });

    res.json({ message: 'Configuration updated successfully', config: updatedConfig });
  } catch (error) {
    if (error instanceof ValidationError) {
      next(error);
    } else {
      next(new InternalServerError('Error updating configuration'));
    }
  }
};


export const getEmailTemplates = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const templateNames = templateManager.getAllTemplateNames();
    res.json(templateNames);
  } catch (error) {
    next(new InternalServerError('Error fetching email templates'));
  }
};

export const updateEmailTemplate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name } = req.params;
    const updates = req.body;
    await templateManager.updateTemplate(name, updates);
    res.json({ message: 'Email template updated successfully' });
  } catch (error) {
    next(error instanceof NotFoundError ? error : new InternalServerError('Error updating email template'));
  }
};