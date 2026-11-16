import CheckToken from './checkuser';
import connectDB from '@/config/connectDB'
import User from '@/models/users'

export default async function authenticate(request) {
  const { user, error, body } = await CheckToken(request);
  if (error || !user) throw new Error(error || 'Authentication failed')
  await connectDB()
  const fullUser = await User.findById(user.id).lean()
  if (!fullUser) throw new Error('User not found')
  if (fullUser.status === false) throw new Error('Tài khoản đã bị vô hiệu hóa')
  return { user: fullUser, body }
};