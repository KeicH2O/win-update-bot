import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  Download, 
  FileCode2, 
  Database, 
  Terminal, 
  Search, 
  Sparkles,
  ExternalLink,
  Info
} from 'lucide-react';
import { BotConfig } from '../types';
import { getD1SchemaSQL, getWorkerJS, getWranglerToml } from '../data/cfCodeTemplates';

interface CodeViewerProps {
  config: BotConfig;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ config }) => {
  const [selectedFile, setSelectedFile] = useState<'schema' | 'worker' | 'wrangler'>('schema');
  const [copied, setCopied] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const schemaSQL = getD1SchemaSQL();
  const workerJS = getWorkerJS(config);
  const wranglerTOML = getWranglerToml();

  const getCurrentContent = () => {
    switch (selectedFile) {
      case 'schema':
        return schemaSQL;
      case 'worker':
        return workerJS;
      case 'wrangler':
        return wranglerTOML;
    }
  };

  const getCurrentFileName = () => {
    switch (selectedFile) {
      case 'schema':
        return 'schema.sql';
      case 'worker':
        return 'worker.js';
      case 'wrangler':
        return 'wrangler.toml';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([getCurrentContent()], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = getCurrentFileName();
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const content = getCurrentContent();
  const lines = content.split('\n');

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Callout */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900/80 to-indigo-950/60 border border-blue-500/20 rounded-2xl p-5 shadow-xl backdrop-blur">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-100">
                2 Готовых файла для ручной вставки в Cloudflare
              </h2>
            </div>
            <p className="text-sm text-slate-300">
              Коды полностью настроены под ваш воркер <code className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono text-xs">win-update-bot</code>, базу <code className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono text-xs">DB</code> и модель <code className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono text-xs">AI</code>.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              id="copy-code-btn"
              onClick={handleCopy}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/25'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Скопировано в буфер!' : `Скопировать ${getCurrentFileName()}`}</span>
            </button>
            <button
              id="download-file-btn"
              onClick={handleDownload}
              title="Скачать файл на диск"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Code Editor Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header Tabs & Actions */}
        <div className="bg-slate-950/80 border-b border-slate-800 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          {/* File Switcher Tabs */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              id="tab-schema-sql"
              onClick={() => setSelectedFile('schema')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                selectedFile === 'schema'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>1. schema.sql (Для D1 Базы)</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">Таблицы</span>
            </button>

            <button
              id="tab-worker-js"
              onClick={() => setSelectedFile('worker')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                selectedFile === 'worker'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileCode2 className="w-4 h-4 text-amber-400" />
              <span>2. worker.js (Код воркера)</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px]">Основной</span>
            </button>

            <button
              id="tab-wrangler-toml"
              onClick={() => setSelectedFile('wrangler')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                selectedFile === 'wrangler'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>wrangler.toml (Инфо)</span>
            </button>
          </div>

          {/* Search bar inside code */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Поиск в коде..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

        </div>

        {/* Instructions strip for currently selected file */}
        <div className="bg-slate-950/40 px-4 py-2.5 border-b border-slate-800/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
            {selectedFile === 'schema' && (
              <span>
                📍 <b>Куда вставить в Cloudflare:</b> Зайдите в <b>Workers & Pages</b> → <b>D1 SQL Database</b> → выберите базу <b>win-update-bot</b> → вкладка <b>Console</b> → вставьте этот SQL и нажмите <b>Execute</b>.
              </span>
            )}
            {selectedFile === 'worker' && (
              <span>
                📍 <b>Куда вставить в Cloudflare:</b> Зайдите в <b>Workers & Pages</b> → выберите <b>win-update-bot</b> → нажмите кнопку <b>Edit Code</b> → замените весь код на этот и нажмите <b>Deploy</b>.
              </span>
            )}
            {selectedFile === 'wrangler' && (
              <span>
                📍 <b>Справочный конфиг:</b> Показывает структуру привязок <code>DB</code>, <code>AI</code> и расписание Cron.
              </span>
            )}
          </div>
          <span className="font-mono text-slate-500 hidden md:inline">{lines.length} строк</span>
        </div>

        {/* Code Content with Line Numbers */}
        <div className="relative max-h-[560px] overflow-auto font-mono text-xs leading-relaxed bg-[#0b101b] p-4 text-slate-300 selection:bg-blue-600 selection:text-white">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => {
                const lineNum = idx + 1;
                const isMatch = searchTerm.length > 1 && line.toLowerCase().includes(searchTerm.toLowerCase());
                return (
                  <tr 
                    key={lineNum} 
                    className={`hover:bg-slate-800/40 ${isMatch ? 'bg-amber-500/20 text-amber-200' : ''}`}
                  >
                    <td className="w-10 pr-4 text-right text-slate-600 select-none align-top font-mono text-[11px]">
                      {lineNum}
                    </td>
                    <td className="whitespace-pre overflow-x-auto break-all font-mono">
                      {line}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Bar */}
        <div className="bg-slate-950/80 border-t border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Готов к копированию без изменений</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-blue-200" />}
            <span>{copied ? 'Скопировано!' : 'Скопировать код'}</span>
          </button>
        </div>

      </div>

      {/* Quick Setup Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-2">
            <Database className="w-4 h-4" /> Шаг 1: База данных D1
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Создана база данных <b>win-update-bot</b></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Выполнен скрипт <code>schema.sql</code> (созданы таблицы <code>updates</code>, <code>subscribers</code>, <code>settings</code>, <code>logs</code>)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Привязка в воркере: <b>Variable name = DB</b></span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-2">
            <FileCode2 className="w-4 h-4" /> Шаг 2: Воркер и AI
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">✓</span>
              <span>Вставлен код <code>worker.js</code> в редактор воркера</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">✓</span>
              <span>Привязка Workers AI: <b>Variable name = AI</b></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">✓</span>
              <span>Секрет <code>TELEGRAM_BOT_TOKEN</code> сохранен</span>
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
};
