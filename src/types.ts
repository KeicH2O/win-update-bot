export interface UpdateItem {
  id?: number;
  guid: string;
  title: string;
  link: string;
  pubDate: string;
  source: 'ms_release_health' | 'windows_insider' | 'ms_catalog' | 'security_update' | 'bleeping_computer';
  category: 'Cumulative Update' | 'Insider Build' | 'Patch Tuesday' | 'Known Issue / Bug' | 'Security Patch';
  kbNumber?: string;
  windowsVersion?: string;
  rawContent: string;
  aiSummary?: string;
  telegramMessageId?: number;
  createdAt?: string;
}

export interface BotConfig {
  botToken: string;
  channelId: string;
  workerUrl: string;
  dbBindingName: string;
  aiBindingName: string;
  aiModel: string;
  cronSchedule: string;
  adminChatId: string;
  language: 'ru' | 'en';
}

export interface SimulatedScenario {
  id: string;
  title: string;
  kbNumber: string;
  windowsVersion: string;
  category: UpdateItem['category'];
  source: UpdateItem['source'];
  date: string;
  link: string;
  summaryNote: string;
  rawHtml: string;
}
