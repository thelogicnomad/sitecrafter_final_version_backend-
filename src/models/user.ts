
import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  googleId?: string;
  username: string;
  email: string;
  password?: string;
  avatar?: string;
  createdAt?: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUserDocument>({
  googleId: { type: String, unique: true, sparse: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password || '');
};

const User: Model<IUserDocument> = mongoose.model<IUserDocument>('User', userSchema);
export default User;
