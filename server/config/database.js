import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../database/videoai.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
  } else {
    console.log('✅ 数据库连接成功');
    initDatabase();
  }
});

// 初始化数据库表
function initDatabase() {
  // 用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      username TEXT,
      avatar TEXT,
      credits INTEGER DEFAULT 20,
      total_spent INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      is_admin BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP
    )
  `);

  // 声音克隆表
  db.run(`
    CREATE TABLE IF NOT EXISTS user_voices (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      audio_url TEXT NOT NULL,
      duration REAL,
      status TEXT DEFAULT 'processing',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 用户模板表
  db.run(`
    CREATE TABLE IF NOT EXISTS user_templates (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      video_url TEXT NOT NULL,
      thumbnail_url TEXT,
      face_detected BOOLEAN DEFAULT 0,
      status TEXT DEFAULT 'processing',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 活动表
  db.run(`
    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      discount REAL,
      bonus_credits INTEGER,
      start_time TIMESTAMP,
      end_time TIMESTAMP,
      banner_text TEXT,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 任务表
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      voice_id TEXT,
      voice_settings TEXT,
      template_id TEXT NOT NULL,
      is_custom_template BOOLEAN DEFAULT 0,
      audio_url TEXT,
      video_url TEXT,
      thumbnail_url TEXT,
      duration REAL,
      segments INTEGER DEFAULT 1,
      cost_breakdown TEXT,
      total_cost INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      error_message TEXT,
      views INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      downloads INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 交易记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL,
      credits INTEGER NOT NULL,
      payment_method TEXT,
      payment_id TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 活动使用记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS promotion_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      promotion_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      task_id TEXT,
      discount_amount INTEGER,
      used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (promotion_id) REFERENCES promotions(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    )
  `);

  // 任务记录表（每日签到、分享等）
  db.run(`
    CREATE TABLE IF NOT EXISTS quest_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quest_type TEXT NOT NULL,
      reward_credits INTEGER,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 草稿表
  db.run(`
    CREATE TABLE IF NOT EXISTS drafts (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      text TEXT,
      voice_settings TEXT,
      template_id TEXT,
      step INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('✅ 数据库表初始化完成');
  
  // 运行迁移（添加新字段）
  runMigrations();
}

// 运行数据库迁移
async function runMigrations() {
  try {
    // 迁移1：添加tasks表分段字段
    const { migrateUp: migrateSegmentation } = await import('../migrations/add_segmentation_fields.js');
    await migrateSegmentation();
    
    // 迁移2：更新drafts表
    const { migrateUp: migrateDrafts } = await import('../migrations/update_drafts_table.js');
    await migrateDrafts();
    
    console.log('✅ 所有数据库迁移完成');
  } catch (error) {
    console.error('⚠️  数据库迁移失败:', error.message);
    // 不阻止应用启动
  }
}

// Promise化的数据库方法
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export default db;
