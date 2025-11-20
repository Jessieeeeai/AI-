import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import Step1TextInput from '../components/create/Step1TextInput';
import Step2VoiceSettings from '../components/create/Step2VoiceSettings';
import Step3TemplateSelect from '../components/create/Step3TemplateSelect';
import Step4PaymentConfirm from '../components/create/Step4PaymentConfirm';

export default function CreatePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    text: '',
    voiceSettings: {
      happiness: 0.7,
      sadness: 0.1,
      anger: 0.0,
      surprise: 0.3,
      pitch: 1.0,
      speed: 1.0,
      volume: 1.0
    },
    voiceId: null, // 自定义声音ID
    templateId: 'template_1',
    isCustomTemplate: false
  });

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 如果未登录，跳转到登录页
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const updateFormData = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    { number: 1, title: '输入文字' },
    { number: 2, title: '调节声音' },
    { number: 3, title: '选择模板' },
    { number: 4, title: '确认支付' }
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* 步骤指示器 */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex flex-col items-center ${
                  currentStep >= step.number ? 'opacity-100' : 'opacity-40'
                }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 transition-all ${
                    currentStep === step.number
                      ? 'bg-gradient-button text-white shadow-glow scale-110'
                      : currentStep > step.number
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-400'
                  }`}>
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  <span className={`text-sm font-medium ${
                    currentStep === step.number ? 'text-primary-purple' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className={`w-6 h-6 mx-4 ${
                    currentStep > step.number ? 'text-primary-purple' : 'text-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 步骤内容 */}
        <div className="glass-card p-8">
          {currentStep === 1 && (
            <Step1TextInput 
              data={formData} 
              updateData={updateFormData}
              onNext={nextStep}
            />
          )}
          {currentStep === 2 && (
            <Step2VoiceSettings 
              data={formData} 
              updateData={updateFormData}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}
          {currentStep === 3 && (
            <Step3TemplateSelect 
              data={formData} 
              updateData={updateFormData}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}
          {currentStep === 4 && (
            <Step4PaymentConfirm 
              data={formData}
              onPrev={prevStep}
            />
          )}
        </div>

        {/* 底部提示 */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-600 bg-white/50 px-4 py-2 rounded-full">
            <Sparkles className="w-4 h-4 text-primary-purple" />
            <span>当前余额: <strong className="text-primary-purple">{user?.credits || 0}积分</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
