/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { CodeViewer } from './components/CodeViewer';
import { SetupGuide } from './components/SetupGuide';
import { AiSimulator } from './components/AiSimulator';
import { FeedMonitor } from './components/FeedMonitor';
import { BotConfigurator } from './components/BotConfigurator';
import { BotConfig } from './types';
import { 
  Database, 
  Cpu, 
  Send, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  Code2,
  Rocket
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('codes');
  const [config, setConfig] = useState<BotConfig>({
    botToken: '8796153108:AAFTCSrIgd3E9qTm1Lh79dKgLHy3O8BAlRk',
    channelId: '',
    workerUrl: 'https://win-update-bot.keich2o.workers.dev',
    dbBindingName: 'DB',
    aiBindingName: 'AI',
    aiModel: '@cf/meta/llama-3.1-8b-instruct',
    cronSchedule: '*/30 * * * *',
    adminChatId: '',
    language: 'ru'
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Navigation Header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} config={config} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Quick System Status Bar */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-400">Worker:</span>
              <span className="font-mono font-semibold text-slate-200">win-update-bot</span>
            </div>

            <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">D1 Binding:</span>
              <span className="font-mono font-semibold text-emerald-300">env.DB</span>
            </div>

            <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-400">AI Model:</span>
              <span className="font-mono font-semibold text-purple-300">Llama-3.1-8B</span>
            </div>

            <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-slate-400">Cron:</span>
              <span className="font-mono font-semibold text-sky-300">Каждые 30 мин</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('simulator')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Тестировать AI пост</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Инструкция</span>
            </button>
          </div>
        </div>

        {/* Tab Content Routing */}
        {activeTab === 'codes' && (
          <CodeViewer config={config} />
        )}

        {activeTab === 'guide' && (
          <SetupGuide config={config} />
        )}

        {activeTab === 'simulator' && (
          <AiSimulator config={config} />
        )}

        {activeTab === 'feeds' && (
          <FeedMonitor />
        )}

        {activeTab === 'config' && (
          <BotConfigurator 
            config={config} 
            onUpdateConfig={setConfig} 
            onNavigateToCodes={() => setActiveTab('codes')}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold">W</div>
            <span>Windows Update & Insider AI Telegram Bot • Cloudflare Workers + D1 + Workers AI</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>LLaMA 3.1 8B Instruct</span>
            <span>•</span>
            <span>RSS Microsoft Catalog</span>
            <span>•</span>
            <a 
              href="https://dash.cloudflare.com" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-slate-200 transition"
            >
              Cloudflare Dash
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
