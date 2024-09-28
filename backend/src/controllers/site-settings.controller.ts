import { Request, Response, NextFunction } from 'express';
import SiteSettings from '../models/site-settings.model';
import { NotFoundError, UnauthorizedError, InternalServerError } from '../utils/custom-errors.util';
import logger from '../utils/logger.util';

export const getSiteSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await SiteSettings.findOne();
    if (!settings) {
      throw new NotFoundError('Site settings not found');
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

export const updateSiteSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      throw new UnauthorizedError('Only admins can update site settings');
    }

    const { siteName, siteDescription, siteKeywords, socialMediaLinks, logoUrl } = req.body;

    let settings = await SiteSettings.findOne();

    if (settings) {
      settings.siteName = siteName;
      settings.siteDescription = siteDescription;
      settings.siteKeywords = siteKeywords;
      settings.socialMediaLinks = socialMediaLinks;
      settings.logoUrl = logoUrl;
    } else {
      settings = new SiteSettings({
        siteName,
        siteDescription,
        siteKeywords,
        socialMediaLinks,
        logoUrl
      });
    }

    await settings.save();
    logger.info('Site settings updated', { updatedBy: req.user.id });
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

export const updateSEOSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      throw new UnauthorizedError('Only admins can update SEO settings');
    }

    const { siteName, siteDescription, siteKeywords } = req.body;

    const settings = await SiteSettings.findOneAndUpdate(
      {},
      { siteName, siteDescription, siteKeywords },
      { new: true, upsert: true }
    );

    logger.info('SEO settings updated', { updatedBy: req.user.id });
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

export const updateSocialMediaLinks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      throw new UnauthorizedError('Only admins can update social media links');
    }

    const { socialMediaLinks } = req.body;

    const settings = await SiteSettings.findOneAndUpdate(
      {},
      { socialMediaLinks },
      { new: true, upsert: true }
    );

    logger.info('Social media links updated', { updatedBy: req.user.id });
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

export const updateLogo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      throw new UnauthorizedError('Only admins can update the logo');
    }

    const { logoUrl } = req.body;

    const settings = await SiteSettings.findOneAndUpdate(
      {},
      { logoUrl },
      { new: true, upsert: true }
    );

    logger.info('Logo updated', { updatedBy: req.user.id });
    res.json(settings);
  } catch (error) {
    next(error);
  }
};