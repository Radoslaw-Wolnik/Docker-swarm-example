// models/User.ts
import mongoose, { Document, Types, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { encrypt, decrypt, hashEmail } from '../utils/encryption.util';
import isEmail from 'validator/lib/isEmail';

export interface IUserDocument extends Document {
  _id: Types.ObjectId;
  isAnonymous: boolean;
  username: string;
  email: string;
  emailHash: string;
  password: string;
  FirstName: string;
  LastName: string;
  Phone?: string;
  profilePicture?: string;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  oneTimeLoginToken?: string;
  oneTimeLoginExpires?: Date;
  deactivationToken?: string;
  deactivationExpires?: Date;
  role: 'client' | 'owner' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  wishlist: Types.ObjectId[];
  shippingAddresses: Types.ObjectId[];
  notificationPreferences: {
    email: boolean;
    //promotions: boolean;
    newsletters: boolean;
    orderupdates: boolean;
  };
  
  lastTimeActive: Date;
  deactivated?: Date;
  getDecryptedEmail(): Promise<string>;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Extend the IUserDocument interface to include static methods
export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

const userSchema = new mongoose.Schema<IUserDocument, IUserModel>({
  isAnonymous: { type: Boolean, default: false },
  username: { 
    type: String, 
    unique: true,
    sparse: true, // Allows null values and ensures uniqueness for non-null values
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    validate: {
      validator: (value: string) => isEmail(value),
      message: 'Invalid email format'
    }
  },
  emailHash: { type: String, index: true, unique: true }, // For faster lookups
  password: { 
    type: String, 
    minlength: [8, 'Password must be at least 8 characters long']
   },
   FirstName: { 
    type: String, 
    required: true, 
    trim: true, // Removes extra spaces
    minlength: 2, // Set a minimum length
    maxlength: 50, // Set a maximum length
    match: /^[a-zA-Zà-žÀ-Ž\s'-]+$/, // Allow letters (with accents), spaces, hyphens, and apostrophes
    validate: {
      validator: function(v) {
        return /^[a-zA-Zà-žÀ-Ž\s'-]+$/.test(v);
      },
      message: props => `${props.value} contains invalid characters!`
    }
  },
  LastName: { 
    type: String, 
    required: true, 
    trim: true,
    minlength: 2,
    maxlength: 50,
    match: /^[a-zA-Zà-žÀ-Ž\s'-]+$/,
    validate: {
      validator: function(v) {
        return /^[a-zA-Zà-žÀ-Ž\s'-]+$/.test(v);
      },
      message: props => `${props.value} contains invalid characters!`
    }
  },
  Phone: { 
    type: String, 
    // required: true, // If you want to make the phone mandatory
    trim: true,
    match: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, // Allows international format, spaces, dashes, etc.
    validate: {
      validator: function(v) {
        return /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(v) && v.length >= 9 && v.length <= 15;
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  profilePicture: { 
    type: String,
    validate: {
      validator: (value: string) => /^\/uploads\/profile-picture\/[\w-]+\.(jpg|jpeg|png|gif)$/.test(value),
      message: 'Invalid profile picture URL format'
    }
  },

  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpires: Date,

  resetPasswordToken: { type: String },
  resetPasswordExpires: Date,

  oneTimeLoginToken: { type: String },
  oneTimeLoginExpires: Date,
  deactivationToken: { type: String },
  deactivationExpires: Date,

  role: { type: String, enum: ['client', 'owner', 'admin'], default: 'client' },
  wishlist: [{ type: Types.ObjectId, ref: 'Product' }],
  shippingAddresses: [{ type: Types.ObjectId, ref: 'Address' }],
  notificationPreferences: {
    email: { type: Boolean, default: true },
    //promotions: { type: Boolean, default: false },
    newsletters: { type: Boolean, default: false },
    orderUpdates: { type: Boolean, default: true },
  },

  lastTimeActive: Date,
},
  { timestamps: true }
);


userSchema.methods.getDecryptedEmail = async function(this: IUserDocument): Promise<string> {
  try {
    return decrypt(this.email);
  } catch (error) {
    throw new Error('Failed to get decrypted email');
  }
};


userSchema.statics.findByEmail = async function(this: IUserModel, email: string): Promise<IUserDocument | null> {
  const emailHash = await hashEmail(email);
  return this.findOne({ emailHash });
};

// Hash password and encrypt email before saving
userSchema.pre('save', async function(this: IUserDocument, next) {
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error instanceof Error ? error : new Error('Failed to hash password'));
    }
  }

  if (this.isModified('email')) {
    try {
      const encryptedEmail = await encrypt(this.email);
      this.email = encryptedEmail;
      this.emailHash = await hashEmail(encryptedEmail);
    } catch (error) {
      return next(new Error('Failed to encrypt email'));
    }
  }

  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(this: IUserDocument, candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Failed to compare password');
  }
};

export default mongoose.model<IUserDocument, IUserModel>('User', userSchema);