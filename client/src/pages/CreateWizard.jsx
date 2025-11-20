import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { ChevronRight, Sparkles } from 'lucide-react';

// 导入新的步骤组件
import Step1ScriptOptimization from '../components/create/Step1ScriptOptimization';
import Step2AudioPreview from '../components/create/Step2AudioPreview';
import Step3TemplateSelect from '../components/create/Step3TemplateSelect';
import Step4SegmentationConfirm from '../components/create/Step4SegmentationConfirm';
import Step5FinalConfirm from '../components/create/Step5FinalConfirm';

/**
 * 优化后的创建向导
 * 
 * 新流程（6步）：
 * 1. AI文案优化 - 输入原文，AI优化为口播文案
 * 2. 试听预览 - 选择声音、调整参数、预览效果
 * 3. 视频模板 - 选择视频模板
 * 4. 智能分段 - 长文本自动分段
 * 5. 最终确认 - 确认所有设置和费用
 */
export default function CreateWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    // Step 1: 文案优化
    originalText: '',
    optimizedText: '',
    optimizationStyle: 'humorous',
    optimizationStats: null,

    // Step 2: 声音设置
    voiceType: 'system', // 'system' or 'custom'
    systemVoiceId: 'male_magnetic',
    customVoiceId: null,
    voiceSettings: {
      speed: 1.0,
      pitch: 1.0,
      volume: 0.8,
      emotions: {
        happiness: 0.7,
        anger: 0.0,
        sadness: 0.1,
        surprise: 0.3
      }
    },
    previewAudioUrl: null,

    // Step 3: 模板选择
    templateId: 'template_1',
    isCustomTemplate: false,

    // Step 4: 分段信息
    segmentationStrategy: 'auto',
    segmentationResult: null,
    segments: [],
    needsSegmentation: false,
    estimatedCost: null,

    // Step 5: 最终确认
    agreedToTerms: false
  });

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 如果未登录，跳转到登录页
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const updateWizardData = (data) => {
    setWizardData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 跳转到指定步骤（只能往回跳）
  const goToStep = (step) => {
    if (step < currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const steps = [
    { number: 1, title: 'AI文案优化', icon: '✍️' },
    { number: 2, title: '试听预览', icon: '🎵' },
    { number: 3, title: '选择模板', icon: '🎬' },
    { number: 4, title: '智能分段', icon: '✂️' },
    { number: 5, title: '确认生成', icon: '✨' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="text-purple-800 font-medium">AI智能创作</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            创建数字人视频
          </h1>
          <p className="text-gray-600">
            从文本到视频，AI帮你搞定一切
          </p>
        </div>

        {/* 步骤指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                {/* 步骤圆圈 */}
                <button
                  onClick={() => goToStep(step.number)}
                  disabled={step.number > currentStep}
                  className={`flex flex-col items-center transition-all ${
                    step.number < currentStep ? 'cursor-pointer hover:scale-105' : ''
                  } ${
                    currentStep >= step.number ? 'opacity-100' : 'opacity-40'
                  } ${
                    step.number > currentStep ? 'cursor-not-allowed' : ''
                  }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-2 transition-all ${
                    currentStep === step.number
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50 scale-110'
                      : currentStep > step.number
                      ? 'bg-green-500 text-white shadow-md'
                      : 'bg-white text-gray-400 border-2 border-gray-200'
                  }`}>
                    {currentStep > step.number ? '✓' : step.icon}
                  </div>
                  <span className={`text-sm font-medium text-center ${
                    currentStep === step.number 
                      ? 'text-purple-700 font-bold' 
                      : currentStep > step.number
                      ? 'text-green-600'
                      : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </button>

                {/* 连接线 */}
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-12 mx-2 mb-6 transition-colors ${
                    currentStep > step.number 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 步骤内容 */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {currentStep === 1 && (
            <Step1ScriptOptimization
              data={wizardData}
              setData={updateWizardData}
              onNext={nextStep}
            />
          )}

          {currentStep === 2 && (
            <Step2AudioPreview
              data={wizardData}
              setData={updateWizardData}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}

          {currentStep === 3 && (
            <Step3TemplateSelect
              data={wizardData}
              setData={updateWizardData}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}

          {currentStep === 4 && (
            <Step4SegmentationConfirm
              data={wizardData}
              setData={updateWizardData}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}

          {currentStep === 5 && (
            <Step5FinalConfirm
              data={wizardData}
              setData={updateWizardData}
              onPrev={prevStep}
            />
          )}
        </div>

        {/* 底部提示 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 提示：你可以点击已完成的步骤返回修改</p>
        </div>
      </div>
    </div>
  );
}
