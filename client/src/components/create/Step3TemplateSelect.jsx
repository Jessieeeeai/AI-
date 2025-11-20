import { useState } from 'react';
import { Video, Play, Upload } from 'lucide-react';

export default function Step3TemplateSelect({ data, updateData, onNext, onPrev }) {
  const [selectedTemplate, setSelectedTemplate] = useState(data.templateId || 'template_1');
  const [showCustomUpload, setShowCustomUpload] = useState(false);

  // 10个预设模板（你会上传实际的视频）
  const templates = [
    { id: 'template_1', name: '模板 1', thumbnail: '/public/templates/template_1_thumb.jpg' },
    { id: 'template_2', name: '模板 2', thumbnail: '/public/templates/template_2_thumb.jpg' },
    { id: 'template_3', name: '模板 3', thumbnail: '/public/templates/template_3_thumb.jpg' },
    { id: 'template_4', name: '模板 4', thumbnail: '/public/templates/template_4_thumb.jpg' },
    { id: 'template_5', name: '模板 5', thumbnail: '/public/templates/template_5_thumb.jpg' },
    { id: 'template_6', name: '模板 6', thumbnail: '/public/templates/template_6_thumb.jpg' },
    { id: 'template_7', name: '模板 7', thumbnail: '/public/templates/template_7_thumb.jpg' },
    { id: 'template_8', name: '模板 8', thumbnail: '/public/templates/template_8_thumb.jpg' },
    { id: 'template_9', name: '模板 9', thumbnail: '/public/templates/template_9_thumb.jpg' },
    { id: 'template_10', name: '模板 10', thumbnail: '/public/templates/template_10_thumb.jpg' },
  ];

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    updateData({ templateId, isCustomTemplate: false });
  };

  const handleNext = () => {
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <Video className="w-6 h-6 mr-2 text-primary-purple" />
          选择视频模板
        </h2>
        <p className="text-gray-600">从预设模板中选择一个，或上传自己的模板</p>
      </div>

      {/* 预设模板 */}
      <div>
        <h3 className="font-semibold mb-4">📁 预设模板（免费）</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template.id)}
              className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                selectedTemplate === template.id
                  ? 'border-primary-purple ring-2 ring-primary-purple/50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              {/* 缩略图占位符 */}
              <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <Video className="w-12 h-12 text-primary-purple/50" />
              </div>
              
              {/* 播放按钮悬浮 */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* 模板名称 */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-sm font-semibold">{template.name}</p>
              </div>

              {/* 选中标记 */}
              {selectedTemplate === template.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary-purple rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 自定义模板上传 */}
      <div>
        <h3 className="font-semibold mb-4">
          🎭 我的自定义模板 
          <span className="text-sm text-primary-pink ml-2">(+50积分/次)</span>
        </h3>
        
        <div className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center hover:border-primary-purple transition-colors cursor-pointer">
          <Upload className="w-12 h-12 mx-auto mb-4 text-primary-purple" />
          <p className="font-semibold mb-2">上传你的人像视频</p>
          <p className="text-sm text-gray-600 mb-4">
            支持 MP4, MOV 格式 | 5-10秒 | 720p以上 | &lt;50MB
          </p>
          <button className="px-6 py-2 bg-purple-100 text-primary-purple rounded-full font-semibold hover:bg-purple-200 transition-colors">
            📤 选择文件上传
          </button>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            💡 <strong>自定义模板要求：</strong>
          </p>
          <ul className="mt-2 space-y-1 text-sm text-yellow-700">
            <li>• 人脸清晰、正面或半侧面</li>
            <li>• 光线充足、背景简洁</li>
            <li>• 无遮挡（眼镜、口罩等）</li>
            <li>• 视频质量越高，生成效果越好</li>
          </ul>
        </div>
      </div>

      {/* 导航按钮 */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onPrev}
          className="px-8 py-3 rounded-full bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
        >
          ← 上一步
        </button>
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
