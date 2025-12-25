// src/admin/initSuperAdmin.js
import Adminuser from '../user/models/user.model.js';
import { hashPassword } from '../utils/index.js';

export const initializeSuperAdmin = async () => {
  try {
    const adminCount = await Adminuser.count();

    if (adminCount > 0) {
      console.log('⚠️ Super Admin initialization skipped: Admin already exists');
      return;
    }

    const defaultSuperAdmin = {
      username: 'Flex Culture',
      email: 'flexculture001@gmail.com',
      password: await hashPassword('Flexculture@123'), 
      phone: '7904202265',
      role: 'Super Admin',                    
      is_active: true,
    };

    const admin = await Adminuser.create(defaultSuperAdmin);
    console.log('✅ Super Admin created:', admin.username);
  } catch (error) {
    console.error('❌ Failed to create Super Admin:', error.message);
  }
};
