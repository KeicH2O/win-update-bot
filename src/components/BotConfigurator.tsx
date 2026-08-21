import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  Send, 
  Database, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { BotConfig } from '../types';

interface BotConfiguratorProps {
  config: BotConfig;
  onUpdateConfig: (newConfig: BotConfig) => void;
  onNavigateToCodes: () => void;
}

export const BotConfigurator: React.FC<BotConfiguratorProps> = ({ 
  config, 
  onUpdateConfig,
  onNavigateToCodes
}) => {
  const [formData, setFormData] = useState<BotConfig>(config);
  const [saved, setSaved] = useState<boolean>(false);

  const handleChange = (field: keyof BotConfig, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    const defaultConfig: BotConfig = {
      botToken: '8796153108:AAFTCSrIgd3E9qTm1Lh79dKgLHy3O8BAlRk',
      channelId: '',
      workerUrl: 'https://win-update-bot.keich2o.workers.dev',
      dbBindingName: 'DB',
      aiBindingName: 'AI',
      aiModel: '@cf/meta/llama-3.1-8b-instruct',
      cronSchedule: '*/30 * * * *',
      adminChatId: '',
      language: 'ru'
    };
    setFormData(defaultConfig);
    onUpdateConfig(defaultConfig);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Генератор персонального конфига</h2>
            <p className="text-xs text-slate-400">
              Значения из этой формы автоматически подставляются в сгенерированный файл <code>worker.js</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Telegram Bot Token */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" /> Telegram Bot Token:
            </label>
            <input
              type="text"
              value={formData.botToken}
              onChange={(e) => handleChange('botToken', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="8796153108:AAFTCS..."
            />
            <p className="text-[11px] text-slate-400">
              Ваш токен бота от @BotFather (также сохраните его в Secret <code>TELEGRAM_BOT_TOKEN</code> в Cloudflare).
            </p>
          </div>

          {/* Telegram Channel ID / Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-400" /> ID или @username Telegram-канала:
            </label>
            <input
              type="text"
              value={formData.channelId}
              onChange={(e) => handleChange('channelId', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="@windows_update_channel или -1001234567890"
            />
            <p className="text-[11px] text-slate-400">
              Канал, куда бот будет автоматически отправлять новости по расписанию.
            </p>
          </div>

          {/* Worker URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> URL адрес Cloudflare Worker:
            </label>
            <input
              type="text"
              value={formData.workerUrl}
              onChange={(e) => handleChange('workerUrl', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="https://win-update-bot.keich2o.workers.dev"
            />
            <p className="text-[11px] text-slate-400">
              Домен воркера для вебхука Telegram и панели управления.
            </p>
          </div>

          {/* AI Model */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" /> Нейросеть Cloudflare Workers AI:
            </label>
            <select
              value={formData.aiModel}
              onChange={(e) => handleChange('aiModel', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="@cf/meta/llama-3.1-8b-instruct">@cf/meta/llama-3.1-8b-instruct (Рекомендуется, быстрая и умная)</option>
              <option value="@cf/meta/llama-3-8b-instruct">@cf/meta/llama-3-8b-instruct (Базовая LLaMA-3)</option>
              <option value="@cf/mistral/mistral-7b-instruct-v0.1">@cf/mistral/mistral-7b-instruct-v0.1 (Mistral 7B)</option>
            </select>
            <p className="text-[11px] text-slate-400">
              Модель запускается бесплатно на серверах Cloudflare без необходимости покупки сторонних ключей OpenAI.
            </p>
          </div>

          {/* D1 Binding Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" /> Имя привязки D1 Database:
            </label>
            <input
              type="text"
              value={formData.dbBindingName}
              onChange={(e) => handleChange('dbBindingName', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="DB"
            />
            <p className="text-[11px] text-slate-400">
              Соответствует <code>env.DB</code> в коде воркера.
            </p>
          </div>

          {/* Cron Schedule */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" /> Cron расписание триггера:
            </label>
            <select
              value={formData.cronSchedule}
              onChange={(e) => handleChange('cronSchedule', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="*/30 * * * *">*/30 * * * * (Каждые 30 минут — Рекомендуется)</option>
              <option value="0 * * * *">0 * * * * (Каждый 1 час)</option>
              <option value="0 */2 * * *">0 */2 * * * (Каждые 2 часа)</option>
              <option value="0 */6 * * *">0 */6 * * * (Каждые 6 часов)</option>
            </select>
            <p className="text-[11px] text-slate-400">
              Частота опроса Microsoft Update Catalog и блогов.
            </p>
          </div>

        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить к исходным</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="submit"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition"
            >
              {saved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{saved ? 'Настройки сохранены!' : 'Применить к коду Worker'}</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToCodes}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <span>Посмотреть код →</span>
            </button>
          </div>
        </div>

      </form>

    </div>
  );
};
