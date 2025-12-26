import { useState, useRef, useEffect } from 'react';
import { previewService, uploadService } from '../../services/api';
import { Play, Pause, Upload, Volume2, Music, RefreshCw, ArrowRight, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';

const Step2AudioPreview = ({ data, setData, onNext, onPrev }) => {
        const [voiceType, setVoiceType] = useState(data.voiceType || 'system');
        const [selectedSystemVoice, setSelectedSystemVoice] = useState(data.systemVoiceId || 'dapiaoliang');
        const [customVoiceId, setCustomVoiceId] = useState(data.customVoiceId || null);
        const [userVoices, setUserVoices] = useState([]);
        const [uploadingVoice, setUploadingVoice] = useState(false);
        const [voiceSettings, setVoiceSettings] = useState(data.voiceSettings || {
                  speed: 1.0,
                  pitch: 1.0,
                  volume: 0.8,
                  emotions: { happiness: 0.7, anger: 0.0, sadness: 0.1, surprise: 0.3 }
        });

        const [segments, setSegments] = useState(data.segments || []);
        const [currentPlayingSegment, setCurrentPlayingSegment] = useState(null);
        const [error, setError] = useState('');

        const audioRef = useRef(null);
        const fileInputRef = useRef(null);

        const systemVoices = [
              { id: 'dapiaoliang', name: '大漂亮的声音', description: '专属定制声音，自然亲切' }
                ];

        useEffect(() => { loadUserVoices(); }, []);

        useEffect(() => {
                  if (data.segments && data.segments.length > 0) {
                              setSegments(data.segments);
                  }
        }, [data.segments]);

        const loadUserVoices = async () => {
                  try {
                              const response = await uploadService.getUserVoices();
                              setUserVoices(response.voices || []);
                  } catch (err) {
                              console.error('加载声音列表失败:', err);
                  }
        };

        const handleGenerateSegmentAudio = async (segmentId) => {
                  const segment = segments.find(s => s.id === segmentId);
                  if (!segment) return;

                  const voiceId = voiceType === 'system' ? selectedSystemVoice : customVoiceId;
                  if (!voiceId) { setError('请选择声音'); return; }

                  updateSegmentStatus(segmentId, 'generating');
                  setError('');

                  try {
                              const audioBlob = await previewService.generateTTS(segment.text, voiceId, voiceSettings);
                              const audioUrl = URL.createObjectURL(audioBlob);

                              const updatedSegments = segments.map(s => 
                                            s.id === segmentId ? { ...s, status: 'ready', audioUrl, audioBlob } : s
                                                                         );
                              setSegments(updatedSegments);
                              setData({ ...data, segments: updatedSegments });

                              setTimeout(() => { playSegmentAudio(segmentId, audioUrl); }, 100);
                  } catch (err) {
                              updateSegmentStatus(segmentId, 'error');
                              setError('分段 ' + segmentId + ' 生成失败：' + (err.message || '未知错误'));
                  }
        };

        const updateSegmentStatus = (segmentId, status) => {
                  setSegments(segments.map(s => s.id === segmentId ? { ...s, status } : s));
        };

        const playSegmentAudio = (segmentId, audioUrl) => {
                  if (!audioRef.current) return;
                  audioRef.current.pause();
                  audioRef.current.src = audioUrl;
                  audioRef.current.volume = voiceSettings.volume;
                  audioRef.current.play();
                  setCurrentPlayingSegment(segmentId);
        };

        const stopAudio = () => {
                  if (!audioRef.current) return;
                  audioRef.current.pause();
                  audioRef.current.currentTime = 0;
                  setCurrentPlayingSegment(null);
        };

        const handleGenerateAllSegments = async () => {
                  const voiceId = voiceType === 'system' ? selectedSystemVoice : customVoiceId;
                  if (!voiceId) { setError('请选择声音'); return; }
                  setError('');
                  for (const segment of segments) {
                              if (segment.status !== 'ready') {
                                            await handleGenerateSegmentAudio(segment.id);
                                            await new Promise(resolve => setTimeout(resolve, 500));
                              }
                  }
        };

        const allSegmentsReady = segments.length > 0 && segments.every(s => s.status === 'ready');

        const handleNext = () => {
                  if (!allSegmentsReady) { setError('请确保所有分段都已生成并试听确认'); return; }
                  setData({
                              ...data, voiceType,
                              systemVoiceId: voiceType === 'system' ? selectedSystemVoice : null,
                              customVoiceId: voiceType === 'custom' ? customVoiceId : null,
                              voiceSettings, segments
                  });
                  onNext();
        };

        const handleUploadVoice = async (event) => {
                  const file = event.target.files[0];
                  if (!file) return;
                  const validExtensions = ['.wav', '.mp3', '.m4a'];
                  const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                  if (!validExtensions.includes(fileExtension)) { setError('只支持WAV、MP3、M4A格式'); return; }
                  if (file.size > 50 * 1024 * 1024) { setError('文件大小不能超过50MB'); return; }

                  setUploadingVoice(true);
                  setError('');
                  try {
                              const response = await uploadService.uploadVoice(file);
                              setUserVoices([response.voice, ...userVoices]);
                              setCustomVoiceId(response.voice.voiceId);
                              setVoiceType('custom');
                  } catch (err) {
                              setError('上传失败：' + (err.message || '未知错误'));
                  } finally {
                              setUploadingVoice(false);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                  }
        };

        const renderStatusBadge = (status) => {
                  if (status === 'pending') {
                              return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">待生成</span>;
                  }
                  if (status === 'generating') {
                              return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" />生成中</span>;
                  }
                  if (status === 'ready') {
                              return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />已确认</span>;
                  }
                  if (status === 'error') {
                              return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">生成失败</span>;
                  }
                  return null;
        };
      
        return (
                  <div className="max-w-7xl mx-auto p-6">
                        <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">🎤 Step 2: 逐段试听确认</h2>
                                <p className="text-gray-600">选择声音并逐段生成试听，确认每段效果满意后进入下一步</p>
                        </div>
                  
                        {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                          <div className="text-sm text-red-800">{error}</div>
                                </div>
                        )}
                  
                        <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-4">
                                          <h3 className="text-lg font-semibold flex items-center gap-2"><Volume2 className="w-5 h-5" />选择声音</h3>
                                
                                          <div className="p-4 border border-gray-200 rounded-lg">
                                                      <label className="flex items-center gap-2 mb-3">
                                                                    <input type="radio" checked={voiceType === 'system'} onChange={() => setVoiceType('system')} className="w-4 h-4 text-blue-600" />
                                                                    <span className="font-medium">系统预制声音</span>
                                                      </label>
                                                {voiceType === 'system' && (
                                      <div className="space-y-2 ml-6">
                                            {systemVoices.map(voice => (
                                                              <label key={voice.id} className={'block p-3 border rounded-lg cursor-pointer transition-all ' + (selectedSystemVoice === voice.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200')}>
                                                                                  <input type="radio" name="systemVoice" checked={selectedSystemVoice === voice.id} onChange={() => setSelectedSystemVoice(voice.id)} className="sr-only" />
                                                                                  <div className="font-medium text-gray-900">{voice.name}</div>
                                                                                  <div className="text-sm text-gray-500">{voice.description}</div>
                                                              </label>
                                                            ))}
                                      </div>
                                                      )}
                                          </div>
                                
                                          <div className="p-4 border border-gray-200 rounded-lg">
                                                      <label className="flex items-center gap-2 mb-3">
                                                                    <input type="radio" checked={voiceType === 'custom'} onChange={() => setVoiceType('custom')} className="w-4 h-4 text-blue-600" />
                                                                    <span className="font-medium">自定义声音克隆</span>
                                                      </label>
                                                {voiceType === 'custom' && (
                                      <div className="ml-6 space-y-3">
                                                      <input ref={fileInputRef} type="file" accept=".wav,.mp3,.m4a" onChange={handleUploadVoice} className="hidden" />
                                                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingVoice} className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
                                                                        <Upload className="w-4 h-4" />{uploadingVoice ? '上传中...' : '上传声音文件'}
                                                      </button>
                                                      <p className="text-xs text-gray-500">支持WAV、MP3、M4A格式，最大50MB</p>
                                            {userVoices.length > 0 && (
                                                              <div className="space-y-2">
                                                                                  <p className="text-sm text-gray-600">或从已上传中选择：</p>
                                                                    {userVoices.map(voice => (
                                                                                          <label key={voice.voiceId} className={'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ' + (customVoiceId === voice.voiceId ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200')}>
                                                                                                                  <input type="radio" name="customVoice" checked={customVoiceId === voice.voiceId} onChange={() => setCustomVoiceId(voice.voiceId)} className="w-4 h-4 text-blue-600" />
                                                                                                                  <div className="flex-1">
                                                                                                                                            <div className="font-medium text-sm">{voice.fileName}</div>
                                                                                                                                            <div className="text-xs text-gray-500">{voice.duration ? voice.duration.toFixed(1) + '秒' : ''} • {new Date(voice.createdAt).toLocaleDateString()}</div>
                                                                                                                        </div>
                                                                                                </label>
                                                                                        ))}
                                                              </div>
                                                      )}
                                      </div>
                                                      )}
                                          </div>
                                
                                          <div className="p-4 border border-gray-200 rounded-lg">
                                                      <h4 className="font-semibold mb-3">🎛️ 语音参数</h4>
                                                      <div className="space-y-3">
                                                                    <div>
                                                                                    <label className="flex justify-between text-sm mb-1"><span>语速</span><span className="text-blue-600">{voiceSettings.speed.toFixed(1)}x</span></label>
                                                                                    <input type="range" min="0.5" max="2.0" step="0.1" value={voiceSettings.speed} onChange={(e) => setVoiceSettings({ ...voiceSettings, speed: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                                                                    </div>
                                                                    <div>
                                                                                    <label className="flex justify-between text-sm mb-1"><span>音调</span><span className="text-blue-600">{voiceSettings.pitch.toFixed(1)}x</span></label>
                                                                                    <input type="range" min="0.5" max="2.0" step="0.1" value={voiceSettings.pitch} onChange={(e) => setVoiceSettings({ ...voiceSettings, pitch: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                                                                    </div>
                                                                    <div>
                                                                                    <label className="flex justify-between text-sm mb-1"><span>音量</span><span className="text-blue-600">{(voiceSettings.volume * 100).toFixed(0)}%</span></label>
                                                                                    <input type="range" min="0.0" max="1.0" step="0.1" value={voiceSettings.volume} onChange={(e) => setVoiceSettings({ ...voiceSettings, volume: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                                                                    </div>
                                                              {/* 情绪控制 */}
                                                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                                                                    <h5 className="font-medium text-sm mb-3">🎭 情绪控制</h5>h5>
                                                                                                    <div className="space-y-3">
                                                                                                                          <div>
                                                                                                                                                  <label className="flex justify-between text-sm mb-1"><span>😊 快乐</span>span><span className="text-blue-600">{Math.round((voiceSettings.emotions?.happiness || 0.7) * 100)}%</span>span></label>label>
                                                                                                                                                  <input type="range" min="0" max="1" step="0.1" value={voiceSettings.emotions?.happiness || 0.7} onChange={(e) => setVoiceSettings({ ...voiceSettings, emotions: { ...voiceSettings.emotions, happiness: parseFloat(e.target.value) } })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                                                                                                                  </div>div>
                                                                                                                          <div>
                                                                                                                                                  <label className="flex justify-between text-sm mb-1"><span>😢 悲伤</span>span><span className="text-blue-600">{Math.round((voiceSettings.emotions?.sadness || 0.1) * 100)}%</span>span></label>label>
                                                                                                                                                  <input type="range" min="0" max="1" step="0.1" value={voiceSettings.emotions?.sadness || 0.1} onChange={(e) => setVoiceSettings({ ...voiceSettings, emotions: { ...voiceSettings.emotions, sadness: parseFloat(e.target.value) } })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                                                                                                                  </div>div>
                                                                                                                          <div>
                                                                                                                                                  <label className="flex justify-between text-sm mb-1"><span>😠 愤怒</span>span><span className="text-blue-600">{Math.round((voiceSettings.emotions?.anger || 0) * 100)}%</span>span></label>label>
                                                                                                                                                  <input type="range" min="0" max="1" step="0.1" value={voiceSettings.emotions?.anger || 0} onChange={(e) => setVoiceSettings({ ...voiceSettings, emotions: { ...voiceSettings.emotions, anger: parseFloat(e.target.value) } })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                                                                                                                  </div>div>
                                                                                                                          <div>
                                                                                                                                                  <label className="flex justify-between text-sm mb-1"><span>😮 惊讶</span>span><span className="text-blue-600">{Math.round((voiceSettings.emotions?.surprise || 0.3) * 100)}%</span>span></label>label>
                                                                                                                                                  <input type="range" min="0" max="1" step="0.1" value={voiceSettings.emotions?.surprise || 0.3} onChange={(e) => setVoiceSettings({ ...voiceSettings, emotions: { ...voiceSettings.emotions, surprise: parseFloat(e.target.value) } })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                                                                                                                  </div>div>
                                                                                                            </div>div>
                                                                                </div>div></div>
                                                      </div>
                                          </div>
                                </div>
                        
                                <div className="col-span-2 space-y-4">
                                          <div className="flex items-center justify-between">
                                                      <h3 className="text-lg font-semibold flex items-center gap-2"><Music className="w-5 h-5" />分段试听<span className="text-sm font-normal text-gray-500">（共 {segments.length} 段）</span></h3>
                                                      <button type="button" onClick={handleGenerateAllSegments} disabled={segments.every(s => s.status === 'generating')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300">
                                                                    <RefreshCw className="w-4 h-4" />一键生成全部
                                                      </button>
                                          </div>
                                
                                          <audio ref={audioRef} onEnded={() => setCurrentPlayingSegment(null)} className="hidden" />
                                
                                          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                                {segments.map((segment, index) => (
                                      <div key={segment.id} className={'p-4 border rounded-lg transition-colors ' + (currentPlayingSegment === segment.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300')}>
                                                      <div className="flex items-center justify-between mb-3">
                                                                        <div className="flex items-center gap-3">
                                                                                            <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">{index + 1}</span>
                                                                                            <span className="text-sm text-gray-500">第 {index + 1} 段 · {segment.text.length} 字</span>
                                                                              {renderStatusBadge(segment.status)}
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                              {segment.status === 'ready' && segment.audioUrl && (
                                                                  <button type="button" onClick={() => currentPlayingSegment === segment.id ? stopAudio() : playSegmentAudio(segment.id, segment.audioUrl)} className={'flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ' + (currentPlayingSegment === segment.id ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200')}>
                                                                        {currentPlayingSegment === segment.id ? <><Pause className="w-4 h-4" />暂停</> : <><Play className="w-4 h-4" />播放</>}
                                                                  </button>
                                                                                            )}
                                                                                            <button type="button" onClick={() => handleGenerateSegmentAudio(segment.id)} disabled={segment.status === 'generating'} className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors disabled:bg-gray-100 disabled:text-gray-400">
                                                                                                  {segment.status === 'generating' ? <><RefreshCw className="w-4 h-4 animate-spin" />生成中</> : segment.status === 'ready' ? <><RotateCcw className="w-4 h-4" />重新生成</> : <><Play className="w-4 h-4" />生成试听</>}
                                                                                                  </button>
                                                                        </div>
                                                      </div>
                                                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 leading-relaxed">{segment.text}</div>
                                      </div>
                                    ))}
                                          </div>
                                
                                          <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                                                      <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-4">
                                                                                    <div className="text-sm"><span className="text-gray-600">已确认: </span><span className="font-semibold text-green-600">{segments.filter(s => s.status === 'ready').length}</span><span className="text-gray-600"> / {segments.length} 段</span></div>
                                                                                    <div className="text-sm"><span className="text-gray-600">总字数: </span><span className="font-semibold text-blue-600">{segments.reduce((sum, s) => sum + s.text.length, 0)} 字</span></div>
                                                                    </div>
                                                            {allSegmentsReady && (<span className="flex items-center gap-2 text-green-600 font-semibold"><CheckCircle className="w-5 h-5" />全部确认完成！</span>)}
                                                      </div>
                                          </div>
                                </div>
                        </div>
                  
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">💡 <strong>提示：</strong>点击每段右侧的生成试听按钮，逐段生成语音并试听。如果对某段效果不满意，可以点击重新生成直到满意为止。所有分段确认后，才能进入下一步生成视频。</p>
                        </div>
                  
                        <div className="flex justify-between pt-6">
                                <button type="button" onClick={onPrev} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">← 上一步</button>
                                <button type="button" onClick={handleNext} disabled={!allSegmentsReady} className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-300 transition-all">下一步：选择视频模板<ArrowRight className="w-4 h-4" /></button>
                        </div>
                  </div>
                );
};

export default Step2AudioPreview;
