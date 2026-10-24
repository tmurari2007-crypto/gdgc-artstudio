import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';

export const createAdminUser = async () => {
  const adminName = process.env.ADMIN_NAME || 'Studio Admin';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@artstudio.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';

  try {
    console.log('[Admin Provisioning] Connecting to MongoDB...');
    await connectDB();

    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase().trim() });
    if (existingAdmin) {
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log(`[Admin Provisioning] Upgraded existing user ${adminEmail} to admin role.`);
      } else {
        console.log(`[Admin Provisioning] Admin account already exists: ${adminEmail}`);
      }
    } else {
      const admin = await User.create({
        name: adminName,
        email: adminEmail.toLowerCase().trim(),
        password: adminPassword,
        role: 'admin',
      });
      console.log(`[Admin Provisioning] Successfully created admin account: ${admin.email}`);
      console.log(`[Admin Provisioning] Default Password: ${adminPassword}`);
    }
  } catch (error) {
    console.error('[Admin Provisioning Error]', error);
  } finally {
    await disconnectDB();
  }
};

if (process.argv[1]?.endsWith('createAdmin.js')) {
  createAdminUser();
}
