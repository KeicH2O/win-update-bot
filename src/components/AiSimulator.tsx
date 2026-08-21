import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  RotateCcw, 
  ExternalLink, 
  AlertCircle, 
  MessageSquare, 
  CheckCircle2, 
  Layers,
  HelpCircle,
  FileText
} from 'lucide-react';
import { BotConfig, SimulatedScenario } from '../types';
import { SAMPLE_SCENARIOS } from '../data/sampleScenarios';

interface AiSimulatorProps {
  config: BotConfig;
}

export const AiSimulator: React.FC<AiSimulatorProps> = ({ config }) => {
  const [selectedScenario, setSelectedScenario] = useState<SimulatedScenario>(SAMPLE_SCENARIOS[0]);
  const [customTitle, setCustomTitle] = useState<string>(SAMPLE_SCENARIOS[0].title);
  const [customCategory, setCustomCategory] = useState<string>(SAMPLE_SCENARIOS[0].category);
  const [customLink, setCustomLink] = useState<string>(SAMPLE_SCENARIOS[0].link);
  const [customContent, setCustomContent] = useState<string>(SAMPLE_SCENARIOS[0].rawHtml);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedPost, setGeneratedPost] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Telegram test sending state
  const [testChatId, setTestChatId] = useState<string>(config.channelId || '');
  const [sendingTest, setSendingTest] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSelectScenario = (scenario: SimulatedScenario) => {
    setSelectedScenario(scenario);
    setCustomTitle(scenario.title);
    setCustomCategory(scenario.category);
    setCustomLink(scenario.link);
    setCustomContent(scenario.rawHtml);
    setGeneratedPost('');
    setError(null);
    setSendResult(null);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSendResult(null);

    try {
      const res = await fetch('/api/ai/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle,
          category: customCategory,
          link: customLink,
          rawContent: customContent
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка генерации');
      }

      setGeneratedPost(data.text);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Не удалось сгенерировать пост');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPost = () => {
    navigator.clipboard.writeText(generatedPost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTestToTelegram = async () => {
    if (!testChatId) {
      setSendResult({ success: false, message: 'Укажите ID чата или @username канала' });
      return;
    }
    if (!generatedPost) {
      setSendResult({ success: false, message: 'Сначала сгенерируйте пост' });
      return;
    }

    setSendingTest(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/telegram/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: config.botToken,
          chatId: testChatId,
          text: generatedPost
        })
      });

      const data = await res.json();
      if (data.ok) {
        setSendResult({ success: true, message: `Успешно отправлено в Telegram! Message ID: ${data.result?.message_id}` });
      } else {
        setSendResult({ success: false, message: `Ошибка Telegram API: ${data.description || 'Неизвестная ошибка'}` });
      }
    } catch (err: any) {
      setSendResult({ success: false, message: `Сетевая ошибка: ${err.message}` });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Introduction Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Интерактивный AI-симулятор постов</h2>
            <p className="text-xs text-slate-400">
              Протестируйте качество генерации постов перед деплоем в канал. AI анализирует обновления Windows, находит баги, вычленяет номера KB и составляет воркэраунды.
            </p>
          </div>
        </div>
      </div>

      {/* Scenario Presets Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Выберите готовый реальный сценарий обновления:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SAMPLE_SCENARIOS.map((scenario) => {
            const isSelected = selectedScenario.id === scenario.id;
            return (
              <button
                key={scenario.id}
                id={`scenario-${scenario.id}`}
                onClick={() => handleSelectScenario(scenario)}
                className={`p-3.5 rounded-xl text-left border transition-all duration-150 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-sky-400 border border-slate-700">
                      {scenario.kbNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">{scenario.windowsVersion}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 mb-1">
                    {scenario.title}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-2 pt-2 border-t border-slate-800/80">
                  {scenario.summaryNote}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Editor (Left) & Telegram Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-6 space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-400" /> Исходные данные статьи Microsoft
            </span>
            <button
              onClick={() => handleSelectScenario(selectedScenario)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" /> Сбросить
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Заголовок новости / апдейта:</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* Category & Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Категория:</label>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Cumulative Update">Cumulative Update</option>
                <option value="Insider Build">Insider Build</option>
                <option value="Known Issue / Bug">Known Issue / Bug</option>
                <option value="Security Patch">Security Patch</option>
                <option value="Patch Tuesday">Patch Tuesday</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Официальная ссылка:</label>
              <input
                type="text"
                value={customLink}
                onChange={(e) => setCustomLink(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Raw Text Content */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Текст статьи / Описание релиза Microsoft:
            </label>
            <textarea
              rows={8}
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono leading-relaxed resize-y"
              placeholder="Вставьте текст новости или лог изменений..."
            />
          </div>

          {/* Action Button */}
          <button
            id="generate-post-btn"
            disabled={loading}
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'ИИ анализирует и форматирует пост...' : 'Сгенерировать Telegram-пост с ИИ'}</span>
          </button>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

        </div>

        {/* Right Column: Telegram Message Preview (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-slate-200 uppercase">
                  Превью поста в Telegram (HTML)
                </span>
              </div>
              {generatedPost && (
                <button
                  onClick={handleCopyPost}
                  className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Скопировано!' : 'Копировать HTML'}</span>
                </button>
              )}
            </div>

            {/* Mock Telegram Chat View */}
            <div className="bg-[#17212b] rounded-2xl p-4 sm:p-5 border border-slate-800/80 shadow-inner min-h-[380px] flex flex-col justify-between">
              
              {/* Telegram Channel Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/40 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                    W
                  </div>
                  <div>
                    <div className="font-bold text-slate-200 text-xs">Windows Updates & Fixes</div>
                    <div className="text-[10px] text-slate-400">12 450 подписчиков</div>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">channel</span>
              </div>

              {/* Message Bubble */}
              <div className="my-4">
                {generatedPost ? (
                  <div className="bg-[#242f3d] text-[#f5f5f5] rounded-2xl rounded-tl-sm p-4 text-xs sm:text-sm leading-relaxed shadow-md border border-slate-700/50">
                    <div 
                      className="prose prose-invert max-w-none text-xs sm:text-sm space-y-2 select-text"
                      dangerouslySetInnerHTML={{ __html: generatedPost.replace(/\n/g, '<br/>') }}
                    />
                    <div className="flex items-center justify-end gap-1.5 mt-3 pt-2 text-[10px] text-slate-400">
                      <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <CheckCircle2 className="w-3 h-3 text-sky-400" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500 space-y-3">
                    <Sparkles className="w-10 h-10 mx-auto text-slate-600 animate-bounce" />
                    <p className="text-xs">Нажмите «Сгенерировать Telegram-пост с ИИ» слева для предпросмотра публикации</p>
                  </div>
                )}
              </div>

              {/* Telegram Footer stats */}
              <div className="pt-2 border-t border-slate-700/30 flex items-center justify-between text-[11px] text-slate-400">
                <span>👁️ 1.2K просмотров</span>
                <span>🔥 45 реакций</span>
              </div>

            </div>

            {/* Test Post Sender Box */}
            {generatedPost && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Отправить этот пост в реальный Telegram чат/канал:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="@имя_канала или ID чата"
                    value={testChatId}
                    onChange={(e) => setTestChatId(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    disabled={sendingTest}
                    onClick={handleSendTestToTelegram}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingTest ? 'Отправка...' : 'Отправить в TG'}</span>
                  </button>
                </div>

                {sendResult && (
                  <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    sendResult.success ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' : 'bg-red-950/40 text-red-300 border border-red-500/30'
                  }`}>
                    {sendResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{sendResult.message}</span>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
