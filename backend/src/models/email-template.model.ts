import mongoose, { Schema, Document } from "mongoose";

export interface IEmailTemplate extends Document {
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  variables: string[];
}

const emailTemplateSchema = new Schema<IEmailTemplate>({
  name: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  htmlBody: { type: String, required: true },
  textBody: { type: String, required: true },
  variables: [{ type: String }]
});

const EmailTemplate = mongoose.model<IEmailTemplate>('EmailTemplate', emailTemplateSchema);

export default EmailTemplate;