import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

import User from '../models/user.model';

import {
  RegisterInput,
  LoginInput,
} from '../validators/auth.validator';

import { generateAccessToken } from '../utils/jwt';

// Never authenticate with this value; equalize missing-account bcrypt work.
const dummyPasswordHash = bcrypt.hash(randomBytes(32).toString('hex'), 12);

export const registerUser = async (
  input: RegisterInput
) => {
  const { name, email, password } = input;

  // All valid registration attempts pay the same hashing cost.
  const hashedPassword = await bcrypt.hash(password, 12);

  // Check whether user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error('USER_ALREADY_EXISTS');
  }

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

  // Verify password
  const passwordMatches = await bcrypt.compare(
    password,
    user?.password || await dummyPasswordHash
  );

  if (!user || !passwordMatches || user.isActive === false) {
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
