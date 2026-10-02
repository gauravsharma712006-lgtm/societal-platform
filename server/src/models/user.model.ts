import mongoose, { Document, Schema } from 'mongoose';

export type UserRole =
  | 'USER'
  | 'STUDENT'
  | 'UNIVERSITY'
  | 'MENTOR'
  | 'ORGANIZATION'
  | 'ADMIN';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}


const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: [
        'USER',
        'STUDENT',
        'UNIVERSITY',
        'MENTOR',
        'ORGANIZATION',
        'ADMIN',
      ],
      default: 'USER',
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
  
);

const User = mongoose.model<IUser>('User', userSchema);

export default User;