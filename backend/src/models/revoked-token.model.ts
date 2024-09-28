// models/RevokedToken.ts
import mongoose, { Document, Schema } from 'mongoose';

interface IRevokedTokenDocument extends Document {
  token: string;
  expiresAt: Date;
}

const RevokedTokenSchema = new Schema<IRevokedTokenDocument>({
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

export default mongoose.model<IRevokedTokenDocument>('RevokedToken', RevokedTokenSchema);