import { verifyAuth } from '@/lib/firebase-admin';
import { connectDB } from '@/lib/mongodb';
import Admin from '@/models/Admin';

export async function verifyAdmin(request: Request, requiredRole?: 'super_admin' | 'moderator' | 'support') {
  const decoded = await verifyAuth(request);
  await connectDB();
  
  const admin = await Admin.findOne({ firebaseUid: decoded.uid, status: 'active' });
  if (!admin) {
    throw new Error('Admin access required');
  }
  
  if (requiredRole && admin.role !== requiredRole && admin.role !== 'super_admin') {
    throw new Error('Insufficient admin permissions');
  }
  
  return { decoded, admin };
}
