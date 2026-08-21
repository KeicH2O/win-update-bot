import React, { useState } from 'react';
import { 
  Database, 
  FileCode2, 
  Key, 
  Clock, 
  Send, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { BotConfig } from '../types';

interface SetupGuideProps {
  config: BotConfig;
}

export const SetupGuide: React.FC<SetupGuideProps> = ({ config }) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const steps = [
    {
      id: 1,
      title: 'Инициализация D1 Базы',
      icon: Database,
      badge: 'D1 Console',
      badgeColor: 'emerald',
      desc: 'Создание таблиц updates, subscribers, settings, logs в Cloudflare D1'
    },
    {
      id: 2,
      title: 'Вставка кода Worker',
      icon: FileCode2,
      badge: 'worker.js',
      badgeColor: 'amber',
      desc: 'Замена исходного кода в онлайн-редакторе Cloudflare Worker'
    },
    {
      id: 3,
      title: 'Привязка Bindings & Секретов',
      icon: Key,
      badge: 'DB, AI, TOKEN',
      badgeColor: 'sky',
      desc: 'Подключение D1 (DB), Workers AI (AI) и токена Telegram'
    },
    {
      id: 4,
      title: 'Настройка расписания Cron',
      icon: Clock,
      badge: 'Cron Trigger',
      badgeColor: 'purple',
      desc: 'Автоматический опрос лент Microsoft каждые 30 минут'
    },
    {
      id: 5,
      title: 'Привязка Webhook и Канала',
      icon: Send,
      badge: 'Telegram Link',
      badgeColor: 'blue',
      desc: 'Активация вебхука в 1 клик и назначение канала для публикаций'
    }
  ];

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-100">Пошаговое руководство по запуску</h2>
            </div>
            <p className="text-sm text-slate-400">
              Поскольку вы настраиваете всё вручную в веб-интерфейсе Cloudflare (без Wrangler CLI), следуйте этим 5 простым шагам:
            </p>
          </div>
          <a
            href="https://dash.cloudflare.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
          >
            <span>Открыть Cloudflare Dashboard</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Step Tabs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-6 pt-6 border-t border-slate-800">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCurrent = activeStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all duration-150 ${
                  isCurrent
                    ? 'bg-blue-600/20 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                    : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`p-2 rounded-lg ${isCurrent ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">#{step.id}</span>
                </div>
                <span className="text-xs font-semibold text-slate-200 line-clamp-1">{step.title}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{step.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        
        {/* Step 1 */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Шаг 1: Применение SQL-схемы в базе D1</h3>
                <p className="text-xs text-slate-400">Создание структуры таблиц для хранения истории обновлений и подписчиков</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <p className="font-semibold text-slate-200 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-emerald-400" /> Инструкция по шагам:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <li>Откройте в левом меню Cloudflare раздел <b>Storage & Databases</b> → <b>D1 SQL Database</b>.</li>
                  <li>Кликните по вашей базе данных <b>win-update-bot</b>.</li>
                  <li>Перейдите во вкладку <b>Console</b> (Консоль запросов).</li>
                  <li>Скопируйте код из вкладки <b>schema.sql</b> (или нажмите кнопку ниже) и вставьте в текстовое поле.</li>
                  <li>Нажмите синюю кнопку <b>Execute</b> (Выполнить).</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-emerald-300 text-xs sm:text-sm">Готовый SQL скрипт таблицы D1</div>
                  <div className="text-xs text-emerald-400/80">Создает таблицы updates, subscribers, settings, logs</div>
                </div>
                <button
                  onClick={() => copyToClipboard(getD1SchemaSnippet(), 'schema-snippet')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
                >
                  {copiedText === 'schema-snippet' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedText === 'schema-snippet' ? 'Скопировано!' : 'Скопировать schema.sql'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Шаг 2: Вставка кода Worker (worker.js)</h3>
                <p className="text-xs text-slate-400">Обновление логики парсера, AI-генератора и Telegram-бота</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <p className="font-semibold text-slate-200 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-amber-400" /> Инструкция по шагам:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <li>Перейдите в <b>Compute (Workers)</b> → <b>Workers & Pages</b>.</li>
                  <li>Выберите ваш воркер <b>win-update-bot</b>.</li>
                  <li>Справа вверху нажмите кнопку <b>Edit Code</b> (Редактировать код).</li>
                  <li>В редакторе удалите весь старый код в файле <code>worker.js</code> (или <code>index.js</code>).</li>
                  <li>Вставьте сгенерированный код <b>worker.js</b> из первой вкладки нашего приложения.</li>
                  <li>В правом верхнем углу нажмите кнопку <b>Deploy</b> (или <b>Save and Deploy</b>).</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-amber-300 text-xs sm:text-sm">Воркер содержит всё в одном файле</div>
                  <div className="text-xs text-amber-400/80">Без внешних npm-зависимостей — чистый JS для Cloudflare runtime</div>
                </div>
                <button
                  onClick={() => copyToClipboard(config.workerUrl, 'worker-url')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 text-xs font-semibold transition"
                >
                  {copiedText === 'worker-url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Скопировать URL воркера</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Шаг 3: Проверка Bindings (Привязок) и Секретов</h3>
                <p className="text-xs text-slate-400">Убедитесь, что имена переменных точно совпадают с кодом</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <p className="text-xs sm:text-sm text-slate-300">
                Зайдите в <b>Workers & Pages</b> → <b>win-update-bot</b> → <b>Settings</b> → <b>Bindings</b> (или <i>Variables and Secrets</i>):
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 px-3">Тип привязки</th>
                      <th className="py-2 px-3">Variable name (Имя переменной)</th>
                      <th className="py-2 px-3">Значение / Привязанный ресурс</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    <tr className="bg-slate-900/50">
                      <td className="py-2.5 px-3 font-sans text-emerald-400 font-semibold">D1 Database</td>
                      <td className="py-2.5 px-3 font-bold text-sky-300">DB</td>
                      <td className="py-2.5 px-3">win-update-bot</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans text-purple-400 font-semibold">Workers AI</td>
                      <td className="py-2.5 px-3 font-bold text-sky-300">AI</td>
                      <td className="py-2.5 px-3">Workers AI catalog</td>
                    </tr>
                    <tr className="bg-slate-900/50">
                      <td className="py-2.5 px-3 font-sans text-amber-400 font-semibold">Secret / Variable</td>
                      <td className="py-2.5 px-3 font-bold text-sky-300">TELEGRAM_BOT_TOKEN</td>
                      <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{config.botToken || '8796153108:AAFTCS...'}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans text-blue-400 font-semibold">Variable (Опционально)</td>
                      <td className="py-2.5 px-3 font-bold text-sky-300">TELEGRAM_CHAT_ID</td>
                      <td className="py-2.5 px-3 text-slate-400">@ваш_канал или -100xxxxxxx</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {activeStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Шаг 4: Настройка Cron Triggers (Расписание)</h3>
                <p className="text-xs text-slate-400">Автоматический фоновый запуск воркера без участия пользователя</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <p className="font-semibold text-slate-200 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-purple-400" /> Инструкция по шагам:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <li>Зайдите в <b>Workers & Pages</b> → <b>win-update-bot</b> → <b>Settings</b>.</li>
                  <li>Перейдите во вкладку <b>Triggers</b> (Триггеры).</li>
                  <li>Прокрутите вниз до блока <b>Cron Triggers</b> и нажмите <b>Add Cron Trigger</b>.</li>
                  <li>Выберите периодичность или введите выражение:</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/20 space-y-2">
                  <span className="text-xs font-bold text-purple-400 uppercase">Рекомендуется для новостей:</span>
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono font-bold text-slate-100">*/30 * * * *</code>
                    <button
                      onClick={() => copyToClipboard('*/30 * * * *', 'cron-30')}
                      className="text-xs px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded"
                    >
                      {copiedText === 'cron-30' ? 'Скопировано' : 'Каждые 30 мин'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">Проверяет RSS-ленты два раза в час.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/20 space-y-2">
                  <span className="text-xs font-bold text-purple-400 uppercase">Экономный режим:</span>
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono font-bold text-slate-100">0 */2 * * *</code>
                    <button
                      onClick={() => copyToClipboard('0 */2 * * *', 'cron-2h')}
                      className="text-xs px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded"
                    >
                      {copiedText === 'cron-2h' ? 'Скопировано' : 'Каждые 2 часа'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">Запускает парсер раз в 2 часа.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5 */}
        {activeStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                5
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Шаг 5: Активация Webhook и Подключение Telegram-канала</h3>
                <p className="text-xs text-slate-400">Связывание Telegram API с вашим доменом Worker</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              
              {/* Webhook 1-click */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 space-y-3">
                <h4 className="font-bold text-blue-300 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> 1. Активация Webhook в Telegram (1 клик):
                </h4>
                <p className="text-xs text-slate-300">
                  Поскольку браузерный доступ к воркеру полностью заблокирован (404), связка настраивается напрямую через официальный API Telegram:
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`https://api.telegram.org/bot${config.botToken}/setWebhook?url=${encodeURIComponent(config.workerUrl + '/webhook')}&drop_pending_updates=true`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
                  >
                    <span>Активировать Webhook через Telegram API</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => copyToClipboard(`https://api.telegram.org/bot${config.botToken}/setWebhook?url=${encodeURIComponent(config.workerUrl + '/webhook')}&drop_pending_updates=true`, 'webhook-url')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
                  >
                    {copiedText === 'webhook-url' ? 'Скопировано!' : 'Скопировать URL привязки'}
                  </button>
                </div>
              </div>

              {/* Channel connection */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-400" /> 2. Подключение вашего Telegram-канала:
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-sky-400 font-bold">1.</span>
                    <span>Создайте Telegram-канал (или откройте существующий).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-400 font-bold">2.</span>
                    <span>Добавьте вашего бота <b>@ИмяБота</b> в <b>Администраторы канала</b> (разрешите право <i>Публиковать сообщения</i>).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-400 font-bold">3.</span>
                    <span>Отправьте боту в личном чате команду: <code>/setchannel @имя_вашего_канала</code> (или укажите <code>TELEGRAM_CHAT_ID</code> в настройках воркера).</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        )}

        {/* Navigation between steps */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
          <button
            disabled={activeStep === 1}
            onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition"
          >
            ← Предыдущий шаг
          </button>
          
          <span className="text-xs text-slate-500">Шаг {activeStep} из 5</span>

          <button
            disabled={activeStep === 5}
            onClick={() => setActiveStep(prev => Math.min(5, prev + 1))}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition"
          >
            Следующий шаг →
          </button>
        </div>

      </div>

    </div>
  );
};

function getD1SchemaSnippet(): string {
  return `CREATE TABLE IF NOT EXISTS updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guid TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    link TEXT NOT NULL,
    pub_date TEXT,
    source TEXT NOT NULL,
    category TEXT,
    kb_number TEXT,
    windows_version TEXT,
    raw_content TEXT,
    ai_summary TEXT,
    telegram_message_id INTEGER,
    status TEXT DEFAULT 'published',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_updates_guid ON updates(guid);
CREATE INDEX IF NOT EXISTS idx_updates_kb ON updates(kb_number);

CREATE TABLE IF NOT EXISTS subscribers (
    chat_id TEXT PRIMARY KEY,
    type TEXT DEFAULT 'private',
    username TEXT,
    title TEXT,
    is_active INTEGER DEFAULT 1,
    is_admin INTEGER DEFAULT 0,
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT DEFAULT 'INFO',
    message TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('auto_post_enabled', '1');
INSERT OR IGNORE INTO settings (key, value) VALUES ('ai_model', '@cf/meta/llama-3.1-8b-instruct');
INSERT OR IGNORE INTO settings (key, value) VALUES ('default_channel', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('last_cron_run', 'Никогда');`;
}
