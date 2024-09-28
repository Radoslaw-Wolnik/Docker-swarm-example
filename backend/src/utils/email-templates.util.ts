import Handlebars from 'handlebars';
import EmailTemplate, { IEmailTemplate } from '../models/email-template.model';
import logger from './logger.util';

class EmailTemplateManager {
  private cache: Map<string, IEmailTemplate> = new Map();

  async getTemplate(name: string): Promise<IEmailTemplate | null> {
    if (this.cache.has(name)) {
      return this.cache.get(name)!;
    }

    const template = await EmailTemplate.findOne({ name });
    if (template) {
      this.cache.set(name, template);
    }
    return template;
  }

  async updateTemplate(name: string, updates: Partial<IEmailTemplate>): Promise<void> {
    const result = await EmailTemplate.findOneAndUpdate({ name }, updates, { new: true });
    if (result) {
      this.cache.set(name, result);
    } else {
      throw new Error(`Template "${name}" not found`);
    }
  }

  async getAllTemplateNames(): Promise<string[]> {
    const templates = await EmailTemplate.find({}, 'name');
    return templates.map(t => t.name);
  }

  async renderTemplate(name: string, variables: Record<string, any>): Promise<{ subject: string; html: string; text: string }> {
    const template = await this.getTemplate(name);
    if (!template) {
      throw new Error(`Template "${name}" not found`);
    }

    const subjectTemplate = Handlebars.compile(template.subject);
    const htmlTemplate = Handlebars.compile(template.htmlBody);
    const textTemplate = Handlebars.compile(template.textBody);

    return {
      subject: subjectTemplate(variables),
      html: htmlTemplate(variables),
      text: textTemplate(variables),
    };
  }
}

const templateManager = new EmailTemplateManager();
export default templateManager;