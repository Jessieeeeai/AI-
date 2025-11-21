import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 迁移：为 user_voices 表添加处理相关字段
 * - processed_at: 处理完成时间
 * - error_message: 错误信息
 */

export async function migrateUp() {
  const dbPath = join(__dirname, '../../database/videoai.db');
  const db = new sqlite3.Database(dbPath);

  return new Promise((resolve, reject) => {
    console.log('🔄 [Migration] 添加声音处理字段...');

    db.serialize(() => {
      // 检查字段是否已存在
      db.all("PRAGMA table_info(user_voices)", (err, columns) => {
        if (err) {
          console.error('❌ 获取表信息失败:', err);
          db.close();
          return reject(err);
        }

        const hasProcessedAt = columns.some(col => col.name === 'processed_at');
        const hasErrorMessage = columns.some(col => col.name === 'error_message');

        let addedFields = [];

        // 添加 processed_at 字段
        if (!hasProcessedAt) {
          db.run(`
            ALTER TABLE user_voices 
            ADD COLUMN processed_at DATETIME
          `, (err) => {
            if (err) {
              console.error('❌ 添加 processed_at 字段失败:', err);
            } else {
              console.log('✅ 添加字段: processed_at');
              addedFields.push('processed_at');
            }
          });
        } else {
          console.log('⏭️  字段已存在: processed_at');
        }

        // 添加 error_message 字段
        if (!hasErrorMessage) {
          db.run(`
            ALTER TABLE user_voices 
            ADD COLUMN error_message TEXT
          `, (err) => {
            if (err) {
              console.error('❌ 添加 error_message 字段失败:', err);
            } else {
              console.log('✅ 添加字段: error_message');
              addedFields.push('error_message');
            }
          });
        } else {
          console.log('⏭️  字段已存在: error_message');
        }

        // 等待所有操作完成后关闭数据库
        db.close((err) => {
          if (err) {
            console.error('❌ 关闭数据库失败:', err);
            reject(err);
          } else {
            if (addedFields.length > 0) {
              console.log(`✅ [Migration] 成功添加字段: ${addedFields.join(', ')}`);
            } else {
              console.log('✅ [Migration] 所有字段已存在，无需迁移');
            }
            resolve();
          }
        });
      });
    });
  });
}

export async function migrateDown() {
  console.log('⚠️  不支持回滚此迁移（SQLite 不支持 DROP COLUMN）');
  return Promise.resolve();
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUp()
    .then(() => {
      console.log('✅ 迁移完成');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ 迁移失败:', err);
      process.exit(1);
    });
}
