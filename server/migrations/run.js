/**
 * 数据库迁移执行器
 * 
 * 按顺序执行所有迁移文件
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  console.log('🚀 开始执行数据库迁移...\n');

  try {
    // 获取所有迁移文件
    const migrationFiles = fs.readdirSync(__dirname)
      .filter(file => file.endsWith('.js') && file !== 'run.js')
      .sort(); // 按文件名排序确保执行顺序

    if (migrationFiles.length === 0) {
      console.log('📭 没有找到迁移文件');
      return;
    }

    console.log(`📦 找到 ${migrationFiles.length} 个迁移文件:\n`);
    migrationFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    console.log('');

    // 依次执行每个迁移
    for (const file of migrationFiles) {
      const migrationPath = join(__dirname, file);
      console.log(`▶️  执行迁移: ${file}`);

      try {
        // 动态导入迁移模块
        const migration = await import(`file://${migrationPath}`);
        
        // 执行迁移的 up 函数
        if (typeof migration.migrateUp === 'function') {
          await migration.migrateUp();
          console.log(`✅ ${file} 执行成功\n`);
        } else {
          console.log(`⚠️  ${file} 没有 migrateUp 函数，跳过\n`);
        }
      } catch (error) {
        console.error(`❌ ${file} 执行失败:`, error.message);
        console.error('完整错误:', error);
        
        // 继续执行其他迁移（某些迁移可能已经执行过）
        console.log('⏭️  继续执行下一个迁移...\n');
      }
    }

    console.log('✅ 所有迁移执行完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移执行器失败:', error);
    process.exit(1);
  }
}

// 执行迁移
runMigrations();
