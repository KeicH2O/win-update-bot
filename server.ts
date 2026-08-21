import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. API: AI Post Generation via Gemini (for preview & simulation)
  app.post('/api/ai/generate-post', async (req, res) => {
    try {
      const { title, category, link, rawContent, customInstructions } = req.body;

      if (!title || !rawContent) {
        return res.status(400).json({ error: 'Title and rawContent are required' });
      }

      // Check if GEMINI_API_KEY is configured
      if (!process.env.GEMINI_API_KEY) {
        // Fallback generator if key not present
        const fallbackText = `📌 <b>${escapeHTML(title)}</b>\n\n` +
          `🔹 <b>Категория:</b> ${escapeHTML(category || 'Обновление Windows')}\n\n` +
          `🔹 <b>Основные изменения:</b>\n• Обновление компонентов безопасности и стабильности системы.\n• Исправление внутренних ошибок подсистем.\n\n` +
          `⚠️ <b>Известные проблемы:</b>\n• На текущий момент критических блокирующих сбоев не зафиксировано.\n\n` +
          `🛠️ <b>Рекомендации:</b>\n• Установка через Центр обновления Windows или каталог Microsoft.\n\n` +
          `🔗 <a href="${link || 'https://support.microsoft.com'}">Официальная страница Microsoft</a>\n\n` +
          `#WindowsUpdate #Windows11 #PatchTuesday`;
        return res.json({ text: fallbackText, model: 'local-fallback' });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const systemInstruction = `Ты — ведущий IT-эксперт, редактор и автор популярного русскоязычного Telegram-канала о Windows Update, Windows 11/10 и инсайдерских сборках.
Твоя задача: детально проанализировать новость/статью об обновлении Windows и создать качественный, содержательный, понятный и визуально структурированный пост для Telegram ИСКЛЮЧИТЕЛЬНО НА РУССКОМ ЯЗЫКЕ.

КРИТИЧЕСКИ ВАЖНО:
1. ОБЯЗАТЕЛЬНО переводи заголовок новости и суть проблемы на чистый, понятный технический РУССКИЙ язык! НЕ ОСТАВЛЯЙ англоязычные фразы вроде "causes infinite reboot loops on systems with nested virtualization". Переводи это: "вызывает бесконечный цикл перезагрузок на системах с вложенной виртуализацией (Hyper-V, WSL)".
2. Номера KB (например, <code>KB5039302</code>), номера сборок (например, <code>Build 26100.2033</code>), коды ошибок (<code>0x800f0922</code>, <code>0xc0000001</code>, <code>KERNEL_SECURITY_CHECK_FAILURE</code>) и терминальные команды сохраняй в теге <code>...</code>.
3. Всё остальное описание, симптомы, воркэраунды и список изменений пиши на живом грамотном русском языке.

Используй СТРОГО HTML-разметку для Telegram:
- <b>Жирный текст</b> для заголовков и смысловых акцентов
- <code>Код или команда</code> для KB, номеров сборок, ошибок и консольных команд
- <i>Курсив</i> для важных ремарок и примечаний
- <a href="URL">Текст ссылки</a> для ссылок

Формат и структура поста:
📌 <b>[Переведенный на русский заголовок с версией Windows, номером KB или сборки]</b>

🔹 <b>Что нового / Ключевые изменения:</b>
• Краткий тезис 1 с понятным объяснением
• Краткий тезис 2 с понятным объяснением

⚠️ <b>Известные проблемы и ошибки:</b> (если в тексте нет багов, написать "Критических сбоев на текущий момент не зафиксировано")
• Описание симптомов на русском (циклические перезагрузки, синий экран BSOD, сбои Wi-Fi/принтеров, ошибки установки)

🛠️ <b>Решение / Воркэраунд:</b> (если есть инструкция по устранению или временному обходу)
• Конкретные команды PowerShell/CMD (например <code>wusa /uninstall /kb:xxxxxxx</code>, <code>dism /online ...</code>) или твики в среде восстановления WinRE / BIOS.

—————————————
🤖 @mywebpc_bot — скачает ISO Windows, Office, Server, DirectX, Visual C++, .NET Desktop Runtime, .NET Framework и активирует Windows/Office, WinPE для ремонта Windows и чат помощь
—————————————
💳 <a href="https://yoomoney.ru/fundraise/1H3JR6SC0ON.260412">Поддержать</a>

${customInstructions ? `Дополнительные инструкции от пользователя:\n${customInstructions}` : ''}
Объем: 200-350 слов. Строго по делу, без воды. Хэштеги не использовать. Внешние ссылки на источник статьи не добавлять.`;

      const prompt = `Заголовок: ${title}\nКатегория: ${category}\nСсылка: ${link}\n\nТекст статьи/патча:\n${rawContent}`;

      let generatedText = '';
      // prioritize fast and lightweight models when flash is under heavy demand
      const candidateModels = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.7-flash'];

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.2
            }
          });

          if (response && response.text) {
            generatedText = response.text;
            return res.json({ text: generatedText, model: modelName });
          }
        } catch (modelErr: any) {
          // If a model is unavailable or overloaded (503/429), try next candidate silently
          const status = modelErr?.status || modelErr?.code;
          if (status !== 503 && status !== 429) {
            console.warn(`Model ${modelName} encountered error:`, modelErr?.message || modelErr);
          }
        }
      }

      // If all AI models returned 503 / 429 high demand or errors, generate a structured rich post
      const fallbackPost = generateSmartFallbackPost(title, category, link, rawContent);
      return res.json({ text: fallbackPost, model: 'smart-analyzer-fallback' });
    } catch (err: any) {
      console.error('API Gemini error:', err);
      // Fallback instead of 500 error
      const { title, category, link, rawContent } = req.body || {};
      const fallbackPost = generateSmartFallbackPost(title || 'Обновление Windows', category || 'Update', link || '', rawContent || '');
      return res.json({ text: fallbackPost, model: 'smart-analyzer-fallback' });
    }
  });

  // 2. API: Test Telegram Bot connection & Send sample message
  app.post('/api/telegram/test-send', async (req, res) => {
    try {
      const { token, chatId, text } = req.body;
      if (!token || !chatId) {
        return res.status(400).json({ error: 'Token and chatId are required' });
      }

      const cleanToken = token.trim();
      const response = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          text: text || '🚀 <b>Тестовое сообщение от Windows Update AI Bot</b>\n\nСвязь с Telegram API установлена успешно!',
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          link_preview_options: { is_disabled: true }
        })
      });

      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // 3. API: Fetch Live RSS Feeds (Proxy)
  app.get('/api/rss/fetch-live', async (req, res) => {
    const feedUrl = req.query.url as string;
    if (!feedUrl) {
      return res.status(400).json({ error: 'Feed URL is required' });
    }

    try {
      const fetchRes = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!fetchRes.ok) {
        return res.status(fetchRes.status).json({ error: `Failed to fetch feed: ${fetchRes.statusText}` });
      }

      const xml = await fetchRes.text();
      res.json({ xml, status: fetchRes.status });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Windows Update Bot Manager running on http://localhost:${PORT}`);
  });
}

function escapeHTML(str: string) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function generateSmartFallbackPost(title: string, category: string, link: string, rawContent: string): string {
  const cleanCat = escapeHTML(category || 'Cumulative Update');
  const cleanLink = link || 'https://support.microsoft.com';

  // Extract KB Number
  const kbMatch = (title + ' ' + rawContent).match(/KB\d{6,8}/i);
  const kbNumber = kbMatch ? kbMatch[0].toUpperCase() : null;

  // Extract build number if present
  const buildMatch = (title + ' ' + rawContent).match(/Build\s+(\d{5}(?:\.\d+)?)/i);
  const buildNumber = buildMatch ? buildMatch[0] : null;

  // Translate title to Russian
  let ruTitle = 'Обновление Windows: накопительный патч и исправления';
  if (/reboot loop|infinite reboot/i.test(title + ' ' + rawContent)) {
    ruTitle = `Критический сбой: обновление ${kbNumber || ''} вызывает циклическую перезагрузку ПК на системах с виртуализацией (Hyper-V, WSL)`;
  } else if (/BitLocker/i.test(title + ' ' + rawContent)) {
    ruTitle = `Внимание: патч безопасности ${kbNumber || ''} требует ключ восстановления BitLocker после перезагрузки`;
  } else if (/Easy Anti-Cheat|BSOD/i.test(title + ' ' + rawContent)) {
    ruTitle = `Накопительное обновление ${kbNumber || ''}: исправления системы и возможные конфликты с Anti-Cheat (BSOD)`;
  } else if (/Insider Preview/i.test(title + ' ' + rawContent)) {
    ruTitle = `Вышла новая инсайдерская сборка Windows 11 ${buildNumber || ''}: новые функции и исправления`;
  } else if (kbNumber) {
    ruTitle = `Выпущено обновление ${kbNumber} для Windows 11/10: безопасность и исправление ошибок`;
  }

  // Detect Windows version
  let winVer = 'Windows 11 / Windows 10';
  if (/24H2/i.test(title + ' ' + rawContent)) winVer = 'Windows 11, версия 24H2';
  else if (/23H2/i.test(title + ' ' + rawContent)) winVer = 'Windows 11, версия 23H2';
  else if (/Windows 10/i.test(title + ' ' + rawContent)) winVer = 'Windows 10 (22H2)';
  else if (/Canary/i.test(title + ' ' + rawContent)) winVer = 'Windows 11 (Canary Channel)';
  else if (/Dev Channel/i.test(title + ' ' + rawContent)) winVer = 'Windows 11 (Dev Channel)';
  else if (/Beta/i.test(title + ' ' + rawContent)) winVer = 'Windows 11 (Beta Channel)';

  // Header line
  const headerParts = [];
  if (kbNumber) headerParts.push(`<code>${kbNumber}</code>`);
  if (buildNumber) headerParts.push(`(Сборка ${buildNumber})`);
  headerParts.push(`— ${winVer}`);

  // Workaround extract
  let workaround = '• Рекомендуется стандартная установка через Центр обновления Windows.';
  if (/wusa \/uninstall/i.test(rawContent)) {
    workaround = `• Для экстренного удаления проблемного патча введите в терминале: <code>wusa /uninstall /kb:${kbNumber?.replace('KB', '') || 'xxxxxxx'}</code>`;
  } else if (/dism.*revertpendingactions/i.test(rawContent)) {
    workaround = '• Для отката зависших действий в среде восстановления WinRE выполните команду: <code>dism /image:C:\\ /cleanup-image /revertpendingactions</code>';
  } else if (/DISM/i.test(rawContent) || /sfc \/scannow/i.test(rawContent)) {
    workaround = '• Для восстановления системных файлов выполните: <code>DISM /Online /Cleanup-Image /RestoreHealth</code> и <code>sfc /scannow</code>';
  } else if (kbNumber) {
    workaround = `• При ошибке установки: перезагрузите ПК и повторите попытку через Каталог Центра обновления Microsoft (<code>${kbNumber}</code>).`;
  }

  // Known issues extract
  let issues = '• Критических блокирующих сбоев на текущий момент не зафиксировано.';
  if (/infinite reboot|reboot loop/i.test(rawContent)) {
    issues = '• Бесконечный цикл перезагрузок (Boot loop) на экранах загрузки при включенной вложенной виртуализации (WSL, Hyper-V, DevBox).';
  } else if (/BitLocker/i.test(rawContent)) {
    issues = '• Запрос 48-значного ключа восстановления BitLocker при каждой перезагрузке из-за обновления списков Secure Boot DBX.';
  } else if (/BSOD|синий экран|0x800|crash|зависан/i.test(rawContent)) {
    issues = '• Зафиксированы отдельные жалобы на сбои установки или конфликты с драйверами.';
  }

  return `📌 <b>${escapeHTML(ruTitle)}</b>\n${headerParts.join(' ')}\n\n` +
    `🔹 <b>Категория:</b> ${cleanCat}\n\n` +
    `🔹 <b>Ключевые изменения:</b>\n` +
    `• Улучшения стабильности и исправление системных служб Windows.\n` +
    `• Обновление компонентов безопасности ядра и защита от критических уязвимостей.\n\n` +
    `⚠️ <b>Известные проблемы:</b>\n${issues}\n\n` +
    `🛠️ <b>Решение / Воркэраунд:</b>\n${workaround}\n\n` +
    `—————————————\n` +
    `🤖 @mywebpc_bot — скачает ISO Windows, Office, Server, DirectX, Visual C++, .NET Desktop Runtime, .NET Framework и активирует Windows/Office, WinPE для ремонта Windows и чат помощь\n` +
    `—————————————\n` +
    `💳 <a href="https://yoomoney.ru/fundraise/1H3JR6SC0ON.260412">Поддержать</a>`;
}

startServer();
