import { useState, useEffect } from 'react';
import { FileText, AlertCircle } from 'lucide-react';

export default function Step1TextInput({ data, updateData, onNext }) {
  const [text, setText] = useState(data.text || '');
  const [error, setError] = useState('');

  // 计算预估时长（假设平均每分钟300字）
  const estimatedDuration = Math.ceil((text.length / 300) * 60);
  const estimatedMinutes = Math.ceil(estimatedDuration / 60);

  const handleNext = () => {
    if (!text.trim()) {
      setError('请输入文字内容');
      return;
    }

    if (text.length < 10) {
      setError('文字内容至少需要10个字符');
      return;
    }

    if (text.length > 5000) {
      setError('文字内容不能超过5000字符');
      return;
    }

    updateData({ text: text.trim() });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <FileText className="w-6 h-6 mr-2 text-primary-purple" />
          输入你的文字
        </h2>
        <p className="text-gray-600">请输入想要转换成视频的文字内容</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError('');
          }}
          className="w-full h-64 px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none transition-colors bg-white/80 resize-none"
          placeholder="在这里输入你想说的话...&#10;&#10;例如：&#10;大家好，欢迎来到我的频道！今天我要和大家分享一个非常实用的AI工具..."
        />
        
        <div className="mt-2 flex items-center justify-between text-sm">
          <div className="text-gray-600">
            字数: <span className="font-semibold text-primary-purple">{text.length}</span> / 5000
          </div>
          <div className="text-gray-600">
            ⏱️ 预计时长: 约<span className="font-semibold text-primary-purple">{estimatedDuration}秒</span> ({estimatedMinutes}分钟)
          </div>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <p className="text-sm text-purple-800">
          💡 <strong>提示：</strong>
        </p>
        <ul className="mt-2 space-y-1 text-sm text-purple-700">
          <li>• 请使用标点符号（。！？）分句，方便智能分段</li>
          <li>• 避免使用特殊符号和表情符号</li>
          <li>• 建议每段视频不超过3分钟</li>
        </ul>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="btn-gradient px-8 py-3"
        >
          下一步 →
        </button>
      </div>
    </div>
  );
}
