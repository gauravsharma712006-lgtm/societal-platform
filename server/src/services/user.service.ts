import User from '../models/user.model';

import {
  UpdateProfileInput,
} from '../validators/user.validator';

export const updateUserProfile = async (
  userId: string,
  input: UpdateProfileInput
) => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        name: input.name,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).select('-password');

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };
};



export const getStudents = async () => {
  const students = await User.find({
    role: 'STUDENT',
  })
    .select('_id name email role isVerified')
    .sort({ name: 1 });

  return students;
};