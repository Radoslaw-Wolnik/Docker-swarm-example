import SiteSettings from '../models/site-settings.model';
import EmailTemplate, { IEmailTemplate } from '../models/email-template.model';
import logger from './logger.util';
import fs from 'fs/promises';
import path from 'path';


export async function initializeAppData(): Promise<void> {
  await initializeSiteSettings();
  await initializeEmailTemplates();
}

async function initializeSiteSettings(): Promise<void> {
  try {
    const settingsPath = path.join(__dirname, '../resources/site-settings.json');
    const data = await fs.readFile(settingsPath, 'utf8');
    const defaultSettings = JSON.parse(data);

    const settings = await SiteSettings.findOneAndUpdate(
      {},
      { $setOnInsert: defaultSettings },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    logger.info('Site settings initialized', { settingsId: settings._id });
  } catch (error) {
    logger.error('Failed to initialize site settings', { error });
  }
}

async function initializeEmailTemplates(): Promise<void> {
  try {
    const templatesPath = path.join(__dirname, '../resources/email-templates.json');
    const data = await fs.readFile(templatesPath, 'utf8');
    const templates = JSON.parse(data) as Record<string, IEmailTemplate>;

    for (const [name, template] of Object.entries(templates)) {
      await EmailTemplate.findOneAndUpdate(
        { name },
        template as IEmailTemplate,
        { upsert: true, new: true }
      );
    }

    logger.info('Email templates initialized');
  } catch (error) {
    logger.error('Failed to initialize email templates', { error });
  }
}
