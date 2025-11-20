import { dbRun, dbGet, dbAll } from '../config/database.js';

// 获取系统统计数据
export const getStats = async (req, res) => {
  try {
    // 用户统计
    const totalUsers = await dbGet('SELECT COUNT(*) as count FROM users');
    const activeUsers = await dbGet(
      'SELECT COUNT(*) as count FROM users WHERE last_login > datetime("now", "-7 days")'
    );
    
    // 任务统计
    const totalTasks = await dbGet('SELECT COUNT(*) as count FROM tasks');
    const completedTasks = await dbGet(
      'SELECT COUNT(*) as count FROM tasks WHERE status = "completed"'
    );
    const processingTasks = await dbGet(
      'SELECT COUNT(*) as count FROM tasks WHERE status IN ("pending", "processing")'
    );
    const failedTasks = await dbGet(
      'SELECT COUNT(*) as count FROM tasks WHERE status = "failed"'
    );
    
    // 收入统计
    const totalRevenue = await dbGet(
      'SELECT SUM(amount) as total FROM transactions WHERE type = "recharge" AND status = "completed"'
    );
    const todayRevenue = await dbGet(
      'SELECT SUM(amount) as total FROM transactions WHERE type = "recharge" AND status = "completed" AND DATE(created_at) = DATE("now")'
    );
    const thisMonthRevenue = await dbGet(
      'SELECT SUM(amount) as total FROM transactions WHERE type = "recharge" AND status = "completed" AND strftime("%Y-%m", created_at) = strftime("%Y-%m", "now")'
    );
    
    // 积分统计
    const totalCredits = await dbGet('SELECT SUM(credits) as total FROM users');
    const averageCredits = await dbGet('SELECT AVG(credits) as avg FROM users');
    const totalSpent = await dbGet('SELECT SUM(total_spent) as total FROM users');
    
    // 转化率（注册用户中充值过的比例）
    const paidUsers = await dbGet(
      'SELECT COUNT(DISTINCT user_id) as count FROM transactions WHERE type = "recharge"'
    );
    const conversionRate = totalUsers.count > 0 
      ? ((paidUsers.count / totalUsers.count) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers.count,
          active: activeUsers.count,
          inactive: totalUsers.count - activeUsers.count
        },
        tasks: {
          total: totalTasks.count,
          completed: completedTasks.count,
          processing: processingTasks.count,
          failed: failedTasks.count
        },
        revenue: {
          total: totalRevenue.total || 0,
          today: todayRevenue.total || 0,
          thisMonth: thisMonthRevenue.total || 0
        },
        credits: {
          total: totalCredits.total || 0,
          average: Math.round(averageCredits.avg || 0),
          totalSpent: totalSpent.total || 0
        },
        conversionRate: parseFloat(conversionRate)
      }
    });

  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ 
      error: 'fetch_failed',
      message: '获取统计数据失败' 
    });
  }
};

// 获取用户列表
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, email, username, credits, total_spent, level, is_admin, created_at, last_login FROM users';
    let params = [];

    if (search) {
      query += ' WHERE email LIKE ? OR username LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const users = await dbAll(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as count FROM users';
    let countParams = [];
    if (search) {
      countQuery += ' WHERE email LIKE ? OR username LIKE ?';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const total = await dbGet(countQuery, countParams);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    });

  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ 
      error: 'fetch_failed',
      message: '获取用户列表失败' 
    });
  }
};

// 更新用户积分
export const updateUserCredits = async (req, res) => {
  try {
    const { userId } = req.params;
    const { credits, reason } = req.body;

    if (!credits || typeof credits !== 'number') {
      return res.status(400).json({ 
        error: 'invalid_credits',
        message: '积分数量无效' 
      });
    }

    // 获取用户当前积分
    const user = await dbGet('SELECT credits FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ 
        error: 'user_not_found',
        message: '用户不存在' 
      });
    }

    // 更新积分
    const newCredits = user.credits + credits;
    await dbRun('UPDATE users SET credits = ? WHERE id = ?', [newCredits, userId]);

    // 记录交易
    await dbRun(
      'INSERT INTO transactions (user_id, type, credits, amount, status) VALUES (?, ?, ?, ?, ?)',
      [userId, credits > 0 ? 'admin_grant' : 'admin_deduct', credits, 0, 'completed']
    );

    res.json({
      success: true,
      message: '积分更新成功',
      newCredits
    });

  } catch (error) {
    console.error('更新用户积分失败:', error);
    res.status(500).json({ 
      error: 'update_failed',
      message: '更新积分失败' 
    });
  }
};

// 获取最近活动
export const getRecentActivities = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // 获取最近的交易
    const recentTransactions = await dbAll(
      `SELECT t.*, u.email, u.username 
       FROM transactions t 
       JOIN users u ON t.user_id = u.id 
       ORDER BY t.created_at DESC 
       LIMIT ?`,
      [parseInt(limit)]
    );

    // 获取最近的任务
    const recentTasks = await dbAll(
      `SELECT t.*, u.email, u.username 
       FROM tasks t 
       JOIN users u ON t.user_id = u.id 
       ORDER BY t.created_at DESC 
       LIMIT ?`,
      [parseInt(limit)]
    );

    // 合并并排序
    const activities = [];

    recentTransactions.forEach(tx => {
      activities.push({
        type: 'transaction',
        action: tx.type,
        user: tx.username || tx.email,
        amount: tx.credits,
        time: tx.created_at
      });
    });

    recentTasks.forEach(task => {
      activities.push({
        type: 'task',
        action: task.status,
        user: task.username || task.email,
        taskId: task.id,
        time: task.created_at
      });
    });

    // 按时间排序
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({
      success: true,
      activities: activities.slice(0, limit)
    });

  } catch (error) {
    console.error('获取最近活动失败:', error);
    res.status(500).json({ 
      error: 'fetch_failed',
      message: '获取活动失败' 
    });
  }
};

// 创建促销活动
export const createPromotion = async (req, res) => {
  try {
    const { type, discount, bonusCredits, startTime, endTime, bannerText } = req.body;

    if (!type) {
      return res.status(400).json({ 
        error: 'invalid_type',
        message: '活动类型无效' 
      });
    }

    await dbRun(
      `INSERT INTO promotions (type, discount, bonus_credits, start_time, end_time, banner_text, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [type, discount || null, bonusCredits || null, startTime, endTime, bannerText, 'active']
    );

    res.json({
      success: true,
      message: '活动创建成功'
    });

  } catch (error) {
    console.error('创建活动失败:', error);
    res.status(500).json({ 
      error: 'create_failed',
      message: '创建活动失败' 
    });
  }
};

// 获取促销活动列表
export const getPromotions = async (req, res) => {
  try {
    const promotions = await dbAll(
      'SELECT * FROM promotions ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      promotions
    });

  } catch (error) {
    console.error('获取活动列表失败:', error);
    res.status(500).json({ 
      error: 'fetch_failed',
      message: '获取活动列表失败' 
    });
  }
};

// 更新促销活动状态
export const updatePromotion = async (req, res) => {
  try {
    const { promotionId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'ended'].includes(status)) {
      return res.status(400).json({ 
        error: 'invalid_status',
        message: '状态无效' 
      });
    }

    await dbRun(
      'UPDATE promotions SET status = ? WHERE id = ?',
      [status, promotionId]
    );

    res.json({
      success: true,
      message: '活动状态更新成功'
    });

  } catch (error) {
    console.error('更新活动失败:', error);
    res.status(500).json({ 
      error: 'update_failed',
      message: '更新活动失败' 
    });
  }
};
