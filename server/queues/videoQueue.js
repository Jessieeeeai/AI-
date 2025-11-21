/**
 * 视频生成任务队列
 * 使用Bull + Redis实现任务队列
 */

import Bull from 'bull';
import videoGenerationWorker from '../workers/videoGenerationWorker.js';

// 创建队列
const videoQueue = new Bull('video-generation', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  },
  defaultJobOptions: {
    attempts: 3, // 失败后重试3次
    backoff: {
      type: 'exponential',
      delay: 5000 // 第一次重试等待5秒
    },
    removeOnComplete: 100, // 保留最近100个完成的任务
    removeOnFail: 200 // 保留最近200个失败的任务
  }
});

/**
 * 处理视频生成任务
 */
videoQueue.process(async (job) => {
  const { taskId } = job.data;
  
  console.log(`\n🎬 [Queue] 开始处理任务: ${taskId}`);
  console.log(`📊 [Queue] 队列状态: ${await videoQueue.getJobCounts()}`);
  
  try {
    // 更新任务进度
    job.progress(0);
    
    // 调用worker处理
    const result = await videoGenerationWorker.processTask(taskId);
    
    job.progress(100);
    
    console.log(`✅ [Queue] 任务完成: ${taskId}`);
    return result;
    
  } catch (error) {
    console.error(`❌ [Queue] 任务失败: ${taskId}`, error);
    throw error;
  }
});

/**
 * 任务事件监听
 */
videoQueue.on('completed', (job, result) => {
  console.log(`✅ [Queue] Job ${job.id} completed with result:`, result);
});

videoQueue.on('failed', (job, err) => {
  console.error(`❌ [Queue] Job ${job.id} failed:`, err.message);
});

videoQueue.on('progress', (job, progress) => {
  console.log(`📊 [Queue] Job ${job.id} progress: ${progress}%`);
});

videoQueue.on('stalled', (job) => {
  console.warn(`⚠️  [Queue] Job ${job.id} stalled`);
});

/**
 * 添加任务到队列
 */
export async function addVideoGenerationJob(taskId, priority = 'normal') {
  const priorityValue = {
    low: 3,
    normal: 2,
    high: 1
  }[priority] || 2;

  const job = await videoQueue.add(
    { taskId },
    {
      priority: priorityValue,
      jobId: taskId // 使用taskId作为jobId，防止重复
    }
  );

  console.log(`📝 [Queue] 任务已加入队列: ${taskId} (Job: ${job.id})`);
  
  return job;
}

/**
 * 获取队列统计信息
 */
export async function getQueueStats() {
  const counts = await videoQueue.getJobCounts();
  const jobs = await videoQueue.getJobs(['active', 'waiting', 'delayed']);
  
  return {
    ...counts,
    activeJobs: jobs.filter(j => j.isActive()).length,
    waitingJobs: jobs.filter(j => j.isWaiting()).length,
    delayedJobs: jobs.filter(j => j.isDelayed()).length
  };
}

/**
 * 暂停队列
 */
export async function pauseQueue() {
  await videoQueue.pause();
  console.log('⏸️  [Queue] 队列已暂停');
}

/**
 * 恢复队列
 */
export async function resumeQueue() {
  await videoQueue.resume();
  console.log('▶️  [Queue] 队列已恢复');
}

/**
 * 清空队列
 */
export async function cleanQueue() {
  await videoQueue.clean(0, 'completed');
  await videoQueue.clean(0, 'failed');
  console.log('🧹 [Queue] 队列已清空');
}

/**
 * 获取任务状态
 */
export async function getJobStatus(jobId) {
  const job = await videoQueue.getJob(jobId);
  
  if (!job) {
    return { status: 'not_found' };
  }

  const state = await job.getState();
  const progress = job.progress();
  const reason = job.failedReason;

  return {
    id: job.id,
    status: state,
    progress,
    failedReason: reason,
    attempts: job.attemptsMade,
    timestamp: job.timestamp
  };
}

export default videoQueue;
