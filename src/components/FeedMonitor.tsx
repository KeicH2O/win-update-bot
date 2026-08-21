import React, { useState } from 'react';
import { 
  Rss, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  Layers, 
  Sparkles,
  Search
} from 'lucide-react';

interface FeedSource {
  id: string;
  name: string;
  url: string;
  category: string;
  description: string;
  badgeColor: string;
}

const SOURCES: FeedSource[] = [
  {
    id: 'windowslatest',
    name: 'Windows Latest (Новости, баги, KB и фиксы)',
    url: 'https://www.windowslatest.com/feed/',
    category: 'Known Issue / Bug',
    description: 'Главный новостной ресурс с ежедневными отчетами о проблемах обновлений Windows 11, накопительных патчах и воркэраундах.',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  },
  {
    id: 'neowin',
    name: 'Neowin Windows 11 (Релизы и сборки)',
    url: 'https://www.neowin.net/tags/windows-11/rss.xml',
    category: 'Cumulative Update',
    description: 'Мгновенные публикации о выходе новых инсайдерских сборок, Patch Tuesday апдейтов и системных изменений Windows.',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  },
  {
    id: 'insider',
    name: 'Windows Insider Blog (Официальный блог)',
    url: 'https://blogs.windows.com/windows-insider/feed/',
    category: 'Insider Build',
    description: 'Официальный блог команды Microsoft Insider. Сборки Canary, Dev, Beta и Release Preview с перечнем исправлений.',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  },
  {
    id: 'pureinfotech',
    name: 'Pureinfotech (Каталог KB и логи патчей)',
    url: 'https://pureinfotech.com/feed/',
    category: 'Cumulative Update',
    description: 'Точные списки изменений всех накопительных обновлений, прямые ссылки на автономные пакеты .MSU и инструкции по откату.',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  },
  {
    id: 'bleeping',
    name: 'BleepingComputer (Безопасность и сбои)',
    url: 'https://www.bleepingcomputer.com/feed/',
    category: 'Known Issue / Bug',
    description: 'Оперативные новости об экстренных ошибках обновлений Windows, BSOD-инцидентах и уязвимостях нулевого дня.',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30'
  }
];

export const FeedMonitor: React.FC = () => {
  const [testingUrl, setTestingUrl] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ [key: string]: { ok: boolean; count?: number; error?: string } }>({});
  const [searchTerm, setSearchTerm] = useState<string>('');

  const testFeed = async (source: FeedSource) => {
    setTestingUrl(source.id);
    try {
      const res = await fetch(`/api/rss/fetch-live?url=${encodeURIComponent(source.url)}`);
      const data = await res.json();

      if (res.ok && data.xml) {
        // Simple count of <item> or <entry> tags
        const itemCount = (data.xml.match(/<item|<entry/g) || []).length;
        setTestResult(prev => ({
          ...prev,
          [source.id]: { ok: true, count: itemCount }
        }));
      } else {
        setTestResult(prev => ({
          ...prev,
          [source.id]: { ok: false, error: data.error || 'Ошибка загрузки' }
        }));
      }
    } catch (err: any) {
      setTestResult(prev => ({
        ...prev,
        [source.id]: { ok: false, error: err.message }
      }));
    } finally {
      setTestingUrl(null);
    }
  };

  const testAllFeeds = async () => {
    for (const s of SOURCES) {
      await testFeed(s);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-lg">
              <Rss className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Источники мониторинга Windows Update</h2>
              <p className="text-xs text-slate-400">
                Ленты, которые Cloudflare Worker опрашивает по Cron-расписанию каждые 30 минут.
              </p>
            </div>
          </div>
          <button
            onClick={testAllFeeds}
            disabled={testingUrl !== null}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingUrl ? 'animate-spin' : ''}`} />
            <span>Проверить доступность всех лент</span>
          </button>
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SOURCES.map((source) => {
          const isTesting = testingUrl === source.id;
          const status = testResult[source.id];

          return (
            <div
              key={source.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
                      <Globe className="w-4 h-4 text-sky-400" />
                    </span>
                    <h3 className="text-sm font-bold text-slate-100">{source.name}</h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${source.badgeColor}`}>
                    {source.category}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {source.description}
                </p>

                <div className="bg-slate-950 p-2 rounded-lg border border-slate-850 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="truncate mr-2">{source.url}</span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:text-sky-300 shrink-0"
                    title="Открыть RSS ленту"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Status and Test Button */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <div>
                  {status ? (
                    status.ok ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Лента активна (Найдено: {status.count} записей)</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
                        <AlertCircle className="w-4 h-4" />
                        <span>{status.error}</span>
                      </span>
                    )
                  ) : (
                    <span className="text-[11px] text-slate-500">Статус не проверялся</span>
                  )}
                </div>

                <button
                  disabled={isTesting}
                  onClick={() => testFeed(source)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin text-sky-400' : ''}`} />
                  <span>{isTesting ? 'Тест...' : 'Тест RSS'}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* How parsing works explanation */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" /> Как работает парсинг и защита от дубликатов в Cloudflare:
        </h3>
        <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">1.</span>
            <span>Воркер делает <code>fetch()</code> к официальным RSS/XML эндпоинтам Microsoft без использования сторонних тяжелых библиотек.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">2.</span>
            <span>Для каждой статьи вычисляется <b>GUID / URL</b> и проверяется в таблице <b>D1 SQL Database</b> (<code>SELECT id FROM updates WHERE guid = ?</code>).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">3.</span>
            <span>Если новость уже публиковалась, она пропускается. Новые апдейты отправляются в нейросеть <code>@cf/meta/llama-3.1-8b-instruct</code>, форматируются и мгновенно публикуются в Telegram.</span>
          </li>
        </ul>
      </div>

    </div>
  );
};
