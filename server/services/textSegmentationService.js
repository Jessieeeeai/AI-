/**
 * 文本智能分段服务
 * 
 * 功能：
 * 1. 根据字数自动分段
 * 2. 按句子边界分段（。！？）
 * 3. 保持语义完整性
 * 4. 生成分段统计信息
 */

class TextSegmentationService {
  /**
   * 分段配置
   */
  constructor() {
    this.config = {
      // 短视频：50-150字/段
      short: {
        minChars: 50,
        maxChars: 150,
        idealChars: 100
      },
      // 中等视频：150-300字/段
      medium: {
        minChars: 150,
        maxChars: 300,
        idealChars: 200
      },
      // 长视频：300-500字/段
      long: {
        minChars: 300,
        maxChars: 500,
        idealChars: 400
      }
    };
    
    // 句子结束标点
    this.sentenceEndings = ['。', '！', '？', '…'];
  }

  /**
   * 智能分段主函数
   * @param {string} text - 需要分段的文本
   * @param {string} strategy - 分段策略: 'auto' | 'short' | 'medium' | 'long'
   * @returns {object} 分段结果
   */
  segmentText(text, strategy = 'auto') {
    if (!text || text.trim().length === 0) {
      throw new Error('文本不能为空');
    }

    const cleanText = text.trim();
    const totalChars = cleanText.length;

    // 自动选择策略
    if (strategy === 'auto') {
      strategy = this.autoSelectStrategy(totalChars);
    }

    // 检查是否需要分段
    const config = this.config[strategy];
    if (totalChars <= config.maxChars) {
      // 不需要分段
      return {
        needsSegmentation: false,
        strategy,
        totalChars,
        segments: [{
          index: 0,
          text: cleanText,
          charCount: totalChars,
          estimatedDuration: this.estimateDuration(totalChars)
        }],
        totalSegments: 1,
        estimatedTotalDuration: this.estimateDuration(totalChars)
      };
    }

    // 需要分段
    const segments = this.performSegmentation(cleanText, config);

    return {
      needsSegmentation: true,
      strategy,
      totalChars,
      segments: segments.map((seg, index) => ({
        index,
        text: seg,
        charCount: seg.length,
        estimatedDuration: this.estimateDuration(seg.length)
      })),
      totalSegments: segments.length,
      estimatedTotalDuration: this.estimateDuration(totalChars)
    };
  }

  /**
   * 自动选择分段策略
   */
  autoSelectStrategy(totalChars) {
    if (totalChars <= 150) {
      return 'short';
    } else if (totalChars <= 300) {
      return 'medium';
    } else {
      return 'long';
    }
  }

  /**
   * 执行分段
   */
  performSegmentation(text, config) {
    const segments = [];
    let currentSegment = '';
    let currentLength = 0;

    // 按句子分割文本
    const sentences = this.splitIntoSentences(text);

    for (const sentence of sentences) {
      const sentenceLength = sentence.length;

      // 如果当前段落为空，直接加入句子
      if (currentLength === 0) {
        currentSegment = sentence;
        currentLength = sentenceLength;
        continue;
      }

      // 如果加入这个句子后不超过最大长度
      if (currentLength + sentenceLength <= config.maxChars) {
        currentSegment += sentence;
        currentLength += sentenceLength;
      } 
      // 如果当前段落已经达到理想长度，开始新段落
      else if (currentLength >= config.idealChars) {
        segments.push(currentSegment);
        currentSegment = sentence;
        currentLength = sentenceLength;
      }
      // 如果当前段落还没到理想长度，但加入会超过最大值
      else {
        // 判断：加入后距离理想值更近吗？
        const currentDistance = Math.abs(config.idealChars - currentLength);
        const afterAddDistance = Math.abs(config.idealChars - (currentLength + sentenceLength));
        
        if (afterAddDistance < currentDistance && currentLength + sentenceLength <= config.maxChars * 1.1) {
          // 加入更好
          currentSegment += sentence;
          currentLength += sentenceLength;
          segments.push(currentSegment);
          currentSegment = '';
          currentLength = 0;
        } else {
          // 不加入更好
          segments.push(currentSegment);
          currentSegment = sentence;
          currentLength = sentenceLength;
        }
      }
    }

    // 添加最后一段
    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }

    return segments;
  }

  /**
   * 将文本分割成句子
   */
  splitIntoSentences(text) {
    const sentences = [];
    let currentSentence = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      currentSentence += char;

      // 检查是否是句子结束标点
      if (this.sentenceEndings.includes(char)) {
        sentences.push(currentSentence);
        currentSentence = '';
      }
    }

    // 添加剩余部分
    if (currentSentence.length > 0) {
      sentences.push(currentSentence);
    }

    return sentences;
  }

  /**
   * 估算语音时长（秒）
   * 平均语速：每秒3-4个汉字
   */
  estimateDuration(charCount) {
    const charsPerSecond = 3.5;
    return Math.ceil(charCount / charsPerSecond);
  }

  /**
   * 分析分段质量
   */
  analyzeSegmentation(segments) {
    const lengths = segments.map(s => s.length);
    const durations = segments.map(s => this.estimateDuration(s.length));

    return {
      totalSegments: segments.length,
      averageLength: Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length),
      minLength: Math.min(...lengths),
      maxLength: Math.max(...lengths),
      totalDuration: durations.reduce((a, b) => a + b, 0),
      averageDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      segmentDurations: durations
    };
  }

  /**
   * 验证分段结果
   */
  validateSegmentation(segments, strategy) {
    const config = this.config[strategy];
    const issues = [];

    segments.forEach((segment, index) => {
      const length = segment.length;

      // 检查是否太短
      if (length < config.minChars * 0.8) {
        issues.push({
          type: 'too_short',
          segmentIndex: index,
          message: `第${index + 1}段太短（${length}字），建议至少${config.minChars}字`
        });
      }

      // 检查是否太长
      if (length > config.maxChars * 1.2) {
        issues.push({
          type: 'too_long',
          segmentIndex: index,
          message: `第${index + 1}段太长（${length}字），建议不超过${config.maxChars}字`
        });
      }

      // 检查是否以标点结束
      const lastChar = segment[segment.length - 1];
      if (!this.sentenceEndings.includes(lastChar)) {
        issues.push({
          type: 'incomplete_sentence',
          segmentIndex: index,
          message: `第${index + 1}段可能句子不完整`
        });
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * 手动调整分段
   * @param {string} text - 原文本
   * @param {number[]} splitPoints - 分割点位置
   */
  manualSegmentation(text, splitPoints) {
    if (!splitPoints || splitPoints.length === 0) {
      return [text];
    }

    // 确保分割点排序且在有效范围内
    const validPoints = [...new Set(splitPoints)]
      .filter(p => p > 0 && p < text.length)
      .sort((a, b) => a - b);

    const segments = [];
    let lastPoint = 0;

    for (const point of validPoints) {
      segments.push(text.substring(lastPoint, point));
      lastPoint = point;
    }

    // 添加最后一段
    segments.push(text.substring(lastPoint));

    return segments.filter(s => s.trim().length > 0);
  }

  /**
   * 获取推荐的分段预览
   */
  getSegmentationPreview(text, strategy = 'auto') {
    try {
      const result = this.segmentText(text, strategy);
      const analysis = this.analyzeSegmentation(result.segments.map(s => s.text));
      const validation = this.validateSegmentation(result.segments.map(s => s.text), result.strategy);

      return {
        success: true,
        ...result,
        analysis,
        validation,
        recommendations: this.generateRecommendations(result, analysis, validation)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成分段建议
   */
  generateRecommendations(result, analysis, validation) {
    const recommendations = [];

    // 如果不需要分段
    if (!result.needsSegmentation) {
      recommendations.push({
        type: 'info',
        message: '文本长度适中，无需分段，将生成单个视频'
      });
      return recommendations;
    }

    // 如果段数太多
    if (result.totalSegments > 10) {
      recommendations.push({
        type: 'warning',
        message: `分段数量较多（${result.totalSegments}段），建议简化文本或使用更长的分段策略`
      });
    }

    // 如果有验证问题
    if (!validation.isValid) {
      validation.issues.forEach(issue => {
        recommendations.push({
          type: 'warning',
          message: issue.message
        });
      });
    }

    // 如果长度差异大
    const lengthVariance = analysis.maxLength - analysis.minLength;
    if (lengthVariance > 100) {
      recommendations.push({
        type: 'info',
        message: '分段长度差异较大，可能导致视频时长不一致'
      });
    }

    // 总时长提示
    if (analysis.totalDuration > 300) {
      recommendations.push({
        type: 'info',
        message: `预计总时长${Math.floor(analysis.totalDuration / 60)}分${analysis.totalDuration % 60}秒，将分${result.totalSegments}个视频生成后自动合并`
      });
    }

    return recommendations;
  }
}

export default new TextSegmentationService();
