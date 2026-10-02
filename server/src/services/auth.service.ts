import bcrypt from 'bcrypt';

import User from '../models/user.model';

import {
  RegisterInput,
  LoginInput,
} from '../validators/auth.validator';

import { generateAccessToken } from '../utils/jwt';

export const registerUser = async (
  input: RegisterInput
) => {
  const { name, email, password } = input;

  // Check whether user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error('USER_ALREADY_EXISTS');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };
};

export const loginUser = async (
  input: LoginInput
) => {
  const { email, password } = input;

  // Find user
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Verify password
  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatches) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Generate access token only after successful login
  const accessToken = generateAccessToken(
    user._id.toString(),
    user.role
  );

  return {
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  };
};