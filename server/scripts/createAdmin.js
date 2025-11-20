import bcrypt from 'bcryptjs';
import { dbRun, dbGet } from '../config/database.js';

async function createAdminUser() {
  try {
    // 检查是否已存在管理员
    const existingAdmin = await dbGet('SELECT * FROM users WHERE email = ?', ['admin@videoai.pro']);
    
    if (existingAdmin) {
      console.log('✅ 管理员账户已存在');
      console.log('Email: admin@videoai.pro');
      return;
    }

    // 创建管理员账户
    const passwordHash = await bcrypt.hash('admin123456', 10);
    
    await dbRun(
      'INSERT INTO users (email, password_hash, username, credits, is_admin) VALUES (?, ?, ?, ?, ?)',
      ['admin@videoai.pro', passwordHash, '系统管理员', 9999, 1]
    );

    console.log('✅ 管理员账户创建成功！');
    console.log('=====================================');
    console.log('Email: admin@videoai.pro');
    console.log('Password: admin123456');
    console.log('=====================================');
    console.log('⚠️  请在生产环境中立即修改密码！');

  } catch (error) {
    console.error('❌ 创建管理员失败:', error);
  }
}

createAdminUser();
