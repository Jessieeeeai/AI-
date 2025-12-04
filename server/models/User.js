import { dbRun, dbGet, dbAll } from '../config/database.js';
import bcrypt from 'bcryptjs';

export class User {
  // 创建用户
  static async create(email, password, username = null) {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await dbRun(
      'INSERT INTO users (email, password_hash, username, credits) VALUES (?, ?, ?, ?)',
      [email, passwordHash, username, 100] // 新用户送20积分
    );
    return result.id;
  }

  // 通过邮箱查找用户
  static async findByEmail(email) {
    return await dbGet('SELECT * FROM users WHERE email = ?', [email]);
  }

  // 通过ID查找用户
  static async findById(id) {
    return await dbGet('SELECT * FROM users WHERE id = ?', [id]);
  }

  // 验证密码
  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // 更新最后登录时间
  static async updateLastLogin(id) {
    await dbRun('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  }

  // 获取用户积分余额
  static async getCredits(userId) {
    const user = await dbGet('SELECT credits FROM users WHERE id = ?', [userId]);
    return user ? user.credits : 0;
  }

  // 扣除积分
  static async deductCredits(userId, amount) {
    const result = await dbRun(
      'UPDATE users SET credits = credits - ?, total_spent = total_spent + ? WHERE id = ? AND credits >= ?',
      [amount, amount, userId, amount]
    );
    return result.changes > 0;
  }

  // 增加积分
  static async addCredits(userId, amount) {
    await dbRun(
      'UPDATE users SET credits = credits + ? WHERE id = ?',
      [amount, userId]
    );
  }

  // 获取用户等级
  static async getLevel(userId) {
    const user = await dbGet('SELECT total_spent, level FROM users WHERE id = ?', [userId]);
    if (!user) return 1;

    // 等级规则：每消费100积分升1级
    const calculatedLevel = Math.floor(user.total_spent / 100) + 1;
    
    // 如果等级需要更新
    if (calculatedLevel !== user.level) {
      await dbRun('UPDATE users SET level = ? WHERE id = ?', [calculatedLevel, userId]);
      return calculatedLevel;
    }
    
    return user.level;
  }

  // 获取用户排名（超越了多少%的用户）
  static async getUserRanking(userId) {
    const user = await dbGet('SELECT total_spent FROM users WHERE id = ?', [userId]);
    if (!user) return 0;

    const result = await dbGet(
      'SELECT COUNT(*) as lower_count FROM users WHERE total_spent < ?',
      [user.total_spent]
    );
    
    const totalUsers = await dbGet('SELECT COUNT(*) as total FROM users');
    
    if (totalUsers.total === 0) return 0;
    
    return Math.round((result.lower_count / totalUsers.total) * 100);
  }

  // 获取用户统计数据
  static async getUserStats(userId) {
    const user = await dbGet(
      'SELECT credits, total_spent, level FROM users WHERE id = ?',
      [userId]
    );

    const tasksCount = await dbGet(
      'SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = "completed"',
      [userId]
    );

    const totalDuration = await dbGet(
      'SELECT SUM(duration) as total FROM tasks WHERE user_id = ? AND status = "completed"',
      [userId]
    );

    const ranking = await this.getUserRanking(userId);

    return {
      credits: user?.credits || 0,
      totalSpent: user?.total_spent || 0,
      level: user?.level || 1,
      tasksCount: tasksCount?.count || 0,
      totalDuration: totalDuration?.total || 0,
      ranking
    };
  }
}
