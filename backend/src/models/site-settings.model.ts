import mongoose, { Schema, Document } from "mongoose";

export interface ISiteSettingsDocument extends Document {
  siteName: string;
  siteDescription: string;
  siteKeywords: string[];
  socialMediaLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  logoUrl: string;
}

const siteSettingsSchema = new Schema<ISiteSettingsDocument>({
  siteName: { type: String, required: true, default: "My Site" },
  siteDescription: { type: String, required: true, default: "Welcome to my site" },
  siteKeywords: [{ type: String }],
  socialMediaLinks: {
    facebook: String,
    twitter: String,
    instagram: String,
  },
  logoUrl: { type: String, default: "/default-logo.png" },
});

// Ensure only one document exists
siteSettingsSchema.static('findOneOrCreate', async function findOneOrCreate(condition, doc) {
  const one = await this.findOne(condition);
  return one || this.create(doc);
});

const SiteSettings = mongoose.model<ISiteSettingsDocument>('SiteSettings', siteSettingsSchema);

export default SiteSettings;