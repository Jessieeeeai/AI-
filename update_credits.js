#!/usr/bin/env node
/**
 * 更新用户积分脚本
 * 使用方法: node update_credits.js <user_id> <credits>
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database/videoai.db');

// 获取命令行参数
const userId = process.argv[2];
const credits = process.argv[3];

if (!userId || !credits) {
  console.error('❌ 用法: node update_credits.js <user_id> <credits>');
  console.error('   示例: node update_credits.js 13 1000');
  process.exit(1);
}

// 连接数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  }
  
  console.log('✅ 数据库连接成功');
  
  // 更新积分
  db.run(
    'UPDATE users SET credits = ? WHERE id = ?',
    [credits, userId],
    function(err) {
      if (err) {
        console.error('❌ 更新失败:', err.message);
        process.exit(1);
      }
      
      if (this.changes === 0) {
        console.error(`❌ 未找到用户ID: ${userId}`);
        process.exit(1);
      }
      
      console.log(`✅ 成功更新用户 ${userId} 的积分为 ${credits}`);
      
      // 查询更新后的用户信息
      db.get(
        'SELECT id, email, username, credits FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) {
            console.error('❌ 查询失败:', err.message);
          } else if (row) {
            console.log('\n📊 用户信息:');
            console.log(`   ID: ${row.id}`);
            console.log(`   邮箱: ${row.email}`);
            console.log(`   用户名: ${row.username}`);
            console.log(`   积分: ${row.credits}`);
          }
          
          db.close();
        }
      );
    }
  );
});
