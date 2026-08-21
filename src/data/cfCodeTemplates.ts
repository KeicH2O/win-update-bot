import { BotConfig } from '../types';

export function getD1SchemaSQL(): string {
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
CREATE INDEX IF NOT EXISTS idx_updates_created ON updates(created_at DESC);

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
INSERT OR IGNORE INTO settings (key, value) VALUES ('last_cron_run', 'Никогда');
`;
}

export function getWorkerJS(config: BotConfig): string {
  return `/**
 * =========================================================================
 * Cloudflare Worker: Windows Update & Insider AI Telegram Bot
 * Worker Name: win-update-bot
 * Domain: ${config.workerUrl || 'https://win-update-bot.keich2o.workers.dev'}
 * Bindings required:
 *   - DB: D1 Database (win-update-bot)
 *   - AI: Cloudflare Workers AI
 *   - TELEGRAM_BOT_TOKEN: Secret or Env var (${config.botToken ? 'задан' : '8796153108:AAFTCSrIgd3E9qTm1Lh79dKgLHy3O8BAlRk'})
 *   - TELEGRAM_CHAT_ID: (Опционально) ID вашего канала, например @win_updates_ru или -100xxxxxx
 * =========================================================================
 */

// Список официальных RSS-лент Microsoft и ведущих профильных изданий с ежедневными обновлениями
const RSS_FEEDS = [
  {
    name: 'Windows Latest (Самые оперативные новости обновлений Windows 11, багов и KB)',
    source: 'windows_latest',
    url: 'https://www.windowslatest.com/feed/',
    category: 'Known Issue / Bug'
  },
  {
    name: 'Neowin Windows 11 (Ежедневные инсайдерские сборки и накопительные апдейты)',
    source: 'neowin',
    url: 'https://www.neowin.net/tags/windows-11/rss.xml',
    category: 'Cumulative Update'
  },
  {
    name: 'Windows Insider Blog (Официальный блог команды Microsoft Insider)',
    source: 'windows_insider',
    url: 'https://blogs.windows.com/windows-insider/feed/',
    category: 'Insider Build'
  },
  {
    name: 'Pureinfotech (Подробные лог-файлы патчей KB и прямые ссылки на MSU)',
    source: 'pureinfotech',
    url: 'https://pureinfotech.com/feed/',
    category: 'Cumulative Update'
  },
  {
    name: 'BleepingComputer Windows (Экстренные баги, сбои BSOD и проблемы безопасности)',
    source: 'bleeping_computer',
    url: 'https://www.bleepingcomputer.com/feed/',
    category: 'Known Issue / Bug'
  }
];

export default {
  /**
   * 1. Обработка входящих HTTP-запросов и Telegram Webhook
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const token = env.TELEGRAM_BOT_TOKEN || '${config.botToken}';

    // ПОЛНАЯ БЛОКИРОВКА БРАУЗЕРА (GET-запросы закрыты)
    // Любой посетитель в браузере видит пустой 404 Not Found без информации о боте
    if (request.method === 'GET') {
      return new Response('404 Not Found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      });
    }

    // Обработка входящего Telegram Webhook (принимаются только POST-запросы от Telegram)
    if (request.method === 'POST') {
      try {
        const update = await request.json();
        await handleTelegramUpdate(update, env);
        return new Response('OK', { status: 200 });
      } catch (err) {
        console.error('Webhook error:', err);
        return new Response('Error: ' + err.message, { status: 500 });
      }
    }

    return new Response('Method Not Allowed', { status: 405 });
  },

  /**
   * 2. Автоматический запуск по расписанию (Cron Trigger)
   * Работает полностью в фоне внутри защищенной инфраструктуры Cloudflare
   */
  async scheduled(event, env, ctx) {
    console.log(\`Cron triggered at: \${new Date().toISOString()}\`);
    try {
      const result = await processAllFeeds(env);
      await logToDB(env.DB, 'SUCCESS', 'Автоматический опрос лент завершен', JSON.stringify(result));
    } catch (err) {
      console.error('Scheduled cron error:', err);
      await logToDB(env.DB, 'ERROR', 'Ошибка при выполнении Cron', err.message);
    }
  }
};

/**
 * =========================================================================
 * ОСНОВНОЙ ПАЙПЛАЙН: Опрос RSS -> Проверка в D1 -> AI Генерация -> Публикация
 * =========================================================================
 */
async function processAllFeeds(env) {
  const token = env.TELEGRAM_BOT_TOKEN || '${config.botToken}';
  const defaultChannel = env.TELEGRAM_CHAT_ID || (await getSetting(env.DB, 'default_channel'));
  const processedItems = [];
  const errors = [];

  for (const feed of RSS_FEEDS) {
    try {
      const items = await fetchAndParseRSS(feed.url, feed.source, feed.category);
      
      // Сортируем статьи по дате публикации (самые свежие первыми)
      items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

      // Проверяем последние актуальные записи из ленты
      for (const item of items.slice(0, 6)) {
        // Фильтр свежести: пропускаем старые статьи старше 14 дней (исключаем архивные новости 2024 года)
        if (item.pubDate) {
          const itemTime = new Date(item.pubDate).getTime();
          if (!isNaN(itemTime)) {
            const ageDays = (Date.now() - itemTime) / (1000 * 60 * 60 * 24);
            if (ageDays > 14) {
              continue; // Пропускаем старые статьи из архивов
            }
          }
        }

        // Проверяем, есть ли уже такое обновление в D1
        const exists = await env.DB.prepare('SELECT id FROM updates WHERE guid = ? OR link = ?')
          .bind(item.guid, item.link)
          .first();

        if (exists) {
          continue; // Уже опубликовано ранее
        }

        // Фильтруем только релевантные новости про Windows, KB, Insider, сборки и баги
        if (!isWindowsUpdateRelevant(item.title, item.rawContent)) {
          continue;
        }

        // 1. Извлекаем номер KB и версию Windows (если есть в тексте)
        const kbMatch = (item.title + ' ' + item.rawContent).match(/KB\\d{6,8}/i);
        const kbNumber = kbMatch ? kbMatch[0].toUpperCase() : null;

        // 2. Генерируем пост через Cloudflare Workers AI
        const aiPost = await generateAIPost(env.AI, item, env.DB);

        // 3. Отправляем в Telegram
        let sentMessageId = null;
        if (defaultChannel) {
          const tgResult = await sendTelegramMessage(token, defaultChannel, aiPost);
          if (tgResult && tgResult.ok) {
            sentMessageId = tgResult.result.message_id;
          }
        }

        // Также рассылаем всем зарегистрированным активным подписчикам
        const subscribers = await env.DB.prepare('SELECT chat_id FROM subscribers WHERE is_active = 1').all();
        if (subscribers && subscribers.results) {
          for (const sub of subscribers.results) {
            if (sub.chat_id !== defaultChannel) {
              await sendTelegramMessage(token, sub.chat_id, aiPost);
            }
          }
        }

        // 4. Сохраняем запись в D1
        await env.DB.prepare(\`
          INSERT INTO updates (guid, title, link, pub_date, source, category, kb_number, raw_content, ai_summary, telegram_message_id, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        \`).bind(
          item.guid,
          item.title,
          item.link,
          item.pubDate || new Date().toISOString(),
          item.source,
          item.category,
          kbNumber,
          item.rawContent.slice(0, 3000),
          aiPost,
          sentMessageId,
          'published'
        ).run();

        processedItems.push({
          title: item.title,
          kb: kbNumber,
          link: item.link,
          telegramMessageId: sentMessageId
        });
      }
    } catch (err) {
      console.error(\`Feed error (\${feed.name}):\`, err);
      errors.push({ feed: feed.name, error: err.message });
      await logToDB(env.DB, 'WARN', \`Ошибка парсинга ленты \${feed.name}\`, err.message);
    }
  }

  // Обновляем время последней проверки
  await setSetting(env.DB, 'last_cron_run', new Date().toISOString());

  return {
    success: true,
    timestamp: new Date().toISOString(),
    processedCount: processedItems.length,
    newItems: processedItems,
    errors
  };
}

/**
 * =========================================================================
 * AI ГЕНЕРАТОР: Cloudflare Workers AI (@cf/meta/llama-3.1-8b-instruct)
 * =========================================================================
 */
async function generateAIPost(ai, item, db = null) {
  if (!ai || typeof ai.run !== 'function') {
    const errorMsg = "Workers AI binding 'AI' не подключен в Cloudflare Dashboard! Перейдите в Settings -> Bindings -> Add -> Workers AI (Variable name: AI)";
    console.error(errorMsg);
    if (db) {
      await logToDB(db, 'ERROR', 'AI Binding Missing', errorMsg);
    }
    return \`📌 <b>\${escapeHTML(item.title)}</b>\\n\\n\` +
      \`⚠️ <b>Внимание:</b> <i>Модуль нейросети Workers AI не подключен в настройках Cloudflare. Добавьте Binding: Workers AI с именем AI в настройках воркера для автоматического перевода статей.</i>\\n\\n\` +
      \`🔹 <b>Категория:</b> \${escapeHTML(item.category)}\\n\` +
      \`🔹 <b>Краткое описание:</b>\\n\${escapeHTML(item.rawContent.slice(0, 300))}...\\n\\n\` +
      \`—————————————\\n\` +
      \`🤖 @mywebpc_bot — скачает ISO Windows, Office, Server, DirectX, Visual C++, .NET Desktop Runtime, .NET Framework и активирует Windows/Office, WinPE для ремонта Windows и чат помощь\\n\` +
      \`—————————————\\n\` +
      \`💳 <a href="https://yoomoney.ru/fundraise/1H3JR6SC0ON.260412">Поддержать</a>\`;
  }

  const models = [
    '@cf/meta/llama-3.1-8b-instruct',
    '@cf/meta/llama-3-8b-instruct',
    '@cf/meta/llama-3.2-3b-instruct',
    '@cf/mistral/mistral-7b-instruct-v0.1'
  ];

  const systemPrompt = \`Ты — профессиональный IT-журналист, редактор и автор русскоязычного Telegram-канала о Windows Update и Windows Insider.
Твоя задача — составить подробный, четкий, грамотный и визуально оформленный пост для Telegram на ЧИСТОМ РУССКОМ ЯЗЫКЕ на основе статьи/новости об обновлении Windows.

КРИТИЧЕСКИ ВАЖНО:
1. ОБЯЗАТЕЛЬНО переводи заголовок новости и всю суть на грамотный русский язык! НЕ ОСТАВЛЯЙ англоязычный заголовок. Например: "Windows 11 KB5039302 causes infinite reboot loops" переводи как "Windows 11: Обновление KB5039302 вызывает циклические перезагрузки".
2. Номера KB (<code>KB5039302</code>), коды ошибок (<code>0x800f0922</code>, <code>0xc0000001</code>) и команды терминала сохраняй в теге <code>...</code>.
3. Описание багов, решений и нововведений пиши на русском языке без воды.

Формат поста (СТРОГО используй HTML-теги для Telegram: <b>жирный</b>, <code>код</code>, <i>курсив</i>):

📌 <b>[Переведенный на русский заголовок с версией Windows, номером KB или сборки]</b>

🔹 <b>Что нового / Основные изменения:</b>
• Краткий тезис 1 с пояснением
• Краткий тезис 2 с пояснением

⚠️ <b>Известные проблемы и ошибки:</b> (если в тексте нет проблем, напиши "На данный момент критических сбоев не зафиксировано")
• Описание симптомов на русском (циклическая перезагрузка, зависание, BSOD, проблемы с играми/принтерами)

🛠️ <b>Решение / Воркэраунд:</b> (если есть инструкция по устранению проблемы или отката)
• Команда для командной строки/PowerShell (например <code>wusa /uninstall /kb:...</code> или <code>dism ...</code>) или шаги в среде WinRE / BIOS.

—————————————
🤖 @mywebpc_bot — скачает ISO Windows, Office, Server, DirectX, Visual C++, .NET Desktop Runtime, .NET Framework и активирует Windows/Office, WinPE для ремонта Windows и чат помощь
—————————————
💳 <a href="https://yoomoney.ru/fundraise/1H3JR6SC0ON.260412">Поддержать</a>

Правила:
- Пиши исключительно на русском языке, без английских абзацев.
- Объем: 200-350 слов. Строго по делу, без воды.
- Не используй хэштеги и не добавляй внешние ссылки на источник статьи.\`;

  const userContent = \`Заголовок статьи: \${item.title}\\nКатегория: \${item.category}\\n\\nТекст статьи (переведи суть на русский и структурируй):\\n\${item.rawContent.slice(0, 4000)}\`;

  for (const model of models) {
    try {
      const response = await ai.run(model, {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        max_tokens: 800,
        temperature: 0.3
      });

      if (response && response.response && response.response.length > 50) {
        return response.response.trim();
      }
    } catch (err) {
      console.warn(\`Workers AI error on \${model}:\`, err.message);
      if (db) {
        await logToDB(db, 'WARN', \`AI error on \${model}\`, err.message);
      }
    }
  }

  // Fallback на русском, если все модели AI временно недоступны
  return \`📌 <b>\${escapeHTML(item.title)}</b>\\n\\n\` +
    \`🔹 <b>Категория:</b> \${escapeHTML(item.category)}\\n\` +
    \`🔹 <b>Краткое описание:</b>\\n\${escapeHTML(item.rawContent.slice(0, 300))}...\\n\\n\` +
    \`—————————————\\n\` +
    \`🤖 @mywebpc_bot — скачает ISO Windows, Office, Server, DirectX, Visual C++, .NET Desktop Runtime, .NET Framework и активирует Windows/Office, WinPE для ремонта Windows и чат помощь\\n\` +
    \`—————————————\\n\` +
    \`💳 <a href="https://yoomoney.ru/fundraise/1H3JR6SC0ON.260412">Поддержать</a>\`;
}

/**
 * =========================================================================
 * ТЕЛЕГРАМ БОТ: Команды, Webhook и отправка сообщений
 * =========================================================================
 */
async function handleTelegramUpdate(update, env) {
  const token = env.TELEGRAM_BOT_TOKEN || '${config.botToken}';
  const msg = update.message || update.channel_post;
  if (!msg || !msg.text) return;

  const chatId = msg.chat.id.toString();
  const text = msg.text.trim();
  const username = msg.from ? (msg.from.username || msg.from.first_name) : 'Channel';

  // 1. Команда /start
  if (text.startsWith('/start')) {
    // Регистрируем подписчика в D1
    await env.DB.prepare(\`
      INSERT INTO subscribers (chat_id, type, username, title, is_active)
      VALUES (?, ?, ?, ?, 1)
      ON CONFLICT(chat_id) DO UPDATE SET is_active = 1, username = ?
    \`).bind(chatId, msg.chat.type, username, msg.chat.title || username, username).run();

    const welcome = \`👋 <b>Добро пожаловать в Windows Update & Insider AI Monitor!</b>\\n\\n\` +
      \`Я автоматически отслеживаю:\\n\` +
      \`• 📦 Новые накопительные обновления Windows 11 и Windows 10 (KB)\\n\` +
      \`• 🧪 Сборки Windows Insider (Canary, Dev, Beta, Release Preview)\\n\` +
      \`• 🚨 Известные баги, ошибки установки (0x800...), сбои принтеров/BSOD\\n\` +
      \`• 🛠️ Способы решения и воркэраунды от экспертов\\n\\n\` +
      \`<b>Доступные команды:</b>\\n\` +
      \`• /check — Запустить ручную проверку новых обновлений сейчас\\n\` +
      \`• /latest — Показать последние 3 проверенных патча\\n\` +
      \`• /stats — Статистика базы и статус мониторинга\\n\` +
      \`• /setchannel @mychannel — Назначить канал для автопостинга (админ)\\n\` +
      \`• /help — Справка\\n\\n\` +
      \`Вы подписаны на получение уведомлений! Вы можете добавить меня в свой канал в качестве Администратора для публикации новостей.\`;

    await sendTelegramMessage(token, chatId, welcome);
    return;
  }

  // 2. Команда /check - Ручной запуск проверки
  if (text.startsWith('/check') || text.startsWith('/update')) {
    await sendTelegramMessage(token, chatId, '🔍 <i>Проверяю официальные ленты Microsoft Update и Insider Blog...</i>');
    const result = await processAllFeeds(env);
    if (result.processedCount > 0) {
      await sendTelegramMessage(token, chatId, \`✅ <b>Найдено и обработано новых обновлений: \${result.processedCount}</b>\`);
    } else {
      await sendTelegramMessage(token, chatId, '👌 <i>Свежих обновлений не найдено. Все последние патчи уже в базе.</i>');
    }
    return;
  }

  // 3. Команда /latest - Последние статьи из D1
  if (text.startsWith('/latest')) {
    const rows = await env.DB.prepare('SELECT title, kb_number, link, ai_summary, raw_content, category, pub_date FROM updates ORDER BY created_at DESC LIMIT 3').all();
    if (!rows.results || rows.results.length === 0) {
      await sendTelegramMessage(token, chatId, 'Пока нет сохраненных обновлений в базе. Отправьте /check для поиска свежих новостей.');
      return;
    }
    for (const item of rows.results) {
      const isLegacyOrEnglish = !item.ai_summary || 
        item.ai_summary.includes('#Windows') || 
        item.ai_summary.includes('What is New') || 
        item.ai_summary.includes('Подробнее на сайте источника') ||
        item.ai_summary.includes('Официальный источник') ||
        item.ai_summary.includes('Официальная страница') ||
        item.ai_summary.includes('@mywebpc_QA');

      if (!isLegacyOrEnglish && item.ai_summary.length > 50) {
        await sendTelegramMessage(token, chatId, item.ai_summary);
      } else {
        // Если старая запись была сохранена на английском или со старой подписью/хэштегами — генерируем свежий русский пост
        const localizedPost = await generateAIPost(env.AI, {
          title: item.title,
          category: item.category || 'Windows Update',
          link: item.link,
          rawContent: item.raw_content || item.title
        });
        // Обновляем запись в базе на чистый русский вариант
        try {
          await env.DB.prepare('UPDATE updates SET ai_summary = ? WHERE link = ?').bind(localizedPost, item.link).run();
        } catch (_) {}
        await sendTelegramMessage(token, chatId, localizedPost);
      }
    }
    return;
  }

  // 4. Команда /diag - Полная диагностика базы D1 и нейросети AI
  if (text.startsWith('/diag') || text.startsWith('/testai') || text.startsWith('/status')) {
    let dbStatus = '❌ Ошибка';
    let dbCount = 0;
    try {
      const c = await env.DB.prepare('SELECT COUNT(*) as count FROM updates').first();
      dbStatus = '✅ Подключена';
      dbCount = c?.count || 0;
    } catch (e) {
      dbStatus = \`❌ Ошибка: \${e.message}\`;
    }

    let aiStatus = '❌ Не привязана в Cloudflare';
    let aiTestResult = '';
    if (env.AI && typeof env.AI.run === 'function') {
      try {
        const testRes = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [{ role: 'user', content: 'Ответь одним словом "Работает" на русском' }],
          max_tokens: 20
        });
        if (testRes && testRes.response) {
          aiStatus = '✅ Работает идеально (Llama 3.1 8B)';
          aiTestResult = testRes.response.trim();
        } else {
          aiStatus = '⚠️ Ответ пустой';
        }
      } catch (aiErr) {
        aiStatus = \`⚠️ Ошибка выполнения AI: \${aiErr.message}\`;
      }
    } else {
      aiStatus = '❌ <b>Binding AI отсутствует!</b>\\n<i>Как исправить:</i> В Cloudflare Dashboard перейдите в Workers -> win-update-bot -> <b>Settings</b> -> <b>Bindings</b> -> нажмите <b>Add</b> -> выберите <b>Workers AI</b> -> задайте имя переменной <code>AI</code> и сохраните.';
    }

    const diagMsg = \`🩺 <b>Диагностика бота Windows Update:</b>\\n\\n\` +
      \`📦 <b>База данных D1:</b> \${dbStatus} (сохранено записей: \${dbCount})\\n\` +
      \`🧠 <b>Нейросеть Workers AI:</b> \${aiStatus}\\n\` +
      (aiTestResult ? \`💬 <b>Тестовый ответ ИИ:</b> <code>\${escapeHTML(aiTestResult)}</code>\\n\` : '') +
      \`\\n<i>Если Workers AI не привязан, бот использует fallback-режим на английском. Для русского перевода обязательно добавьте Workers AI Binding в настройках Cloudflare.</i>\`;

    await sendTelegramMessage(token, chatId, diagMsg);
    return;
  }

  // 5. Команда /cleardb или /reset - Очистить базу от старых тестовых записей
  if (text.startsWith('/cleardb') || text.startsWith('/resetdb')) {
    try {
      await env.DB.prepare('DELETE FROM updates').run();
      await sendTelegramMessage(token, chatId, '🗑️ <b>База новостей успешно очищена!</b>\\n\\nТеперь отправьте команду <code>/check</code>, чтобы бот заново загрузил самые свежие обновления и перевел их на русский язык.');
    } catch (err) {
      await sendTelegramMessage(token, chatId, \`⚠️ Ошибка при очистке: \${err.message}\`);
    }
    return;
  }

  // 6. Команда /stats или /cron
  if (text.startsWith('/stats') || text.startsWith('/cron')) {
    const countUpdates = await env.DB.prepare('SELECT COUNT(*) as count FROM updates').first();
    const countSubs = await env.DB.prepare('SELECT COUNT(*) as count FROM subscribers WHERE is_active = 1').first();
    const lastRun = await getSetting(env.DB, 'last_cron_run');

    const statsMsg = \`📊 <b>Статус автомониторинга Windows Update:</b>\\n\\n\` +
      \`• Сохранено обновлений в D1: <b>\${countUpdates?.count || 0}</b>\\n\` +
      \`• Активных получателей/каналов: <b>\${countSubs?.count || 0}</b>\\n\` +
      \`• Последняя проверка лент: <code>\${lastRun || 'еще не запускалась'}</code>\\n\` +
      \`• ИИ Модель: <code>Llama 3.3 70B / Fast (Workers AI)</code>\\n\\n\` +
      \`💡 <i>Примечание: Бот автоматически публикует посты ТОЛЬКО при выходе НОВОГО патча от Microsoft. Если новых статей с момента прошлой проверки не появилось, бот не спамит повторными постами.</i>\`;

    await sendTelegramMessage(token, chatId, statsMsg);
    return;
  }

  // 5. Команда /setchannel @channel_name
  if (text.startsWith('/setchannel')) {
    const parts = text.split(' ');
    if (parts.length < 2) {
      await sendTelegramMessage(token, chatId, 'Использование: <code>/setchannel @имя_канала</code> или <code>/setchannel -1001234567890</code>');
      return;
    }
    const newChannel = parts[1].trim();
    await setSetting(env.DB, 'default_channel', newChannel);
    await sendTelegramMessage(token, chatId, \`✅ Канал для автоматической публикации установлен: <b>\${newChannel}</b>\\nУбедитесь, что бот добавлен в администраторы этого канала!\`);
    return;
  }

  // 6. Команда /help
  if (text.startsWith('/help')) {
    const helpMsg = \`ℹ️ <b>Справка по боту Windows Update AI:</b>\\n\\n\` +
      \`1. Добавьте бота в ваш Telegram-канал как Администратора (с правом отправки сообщений).\\n\` +
      \`2. Отправьте боту команду <code>/setchannel @ваш_канал</code>\\n\` +
      \`3. Бот каждые 30-60 минут сканирует ленты Microsoft и публикует новые статьи с разбором ошибок и исправлений.\\n\\n\` +
      \`Команды: /check, /latest, /stats, /setchannel\`;
    await sendTelegramMessage(token, chatId, helpMsg);
  }
}

/**
 * Отправка сообщения в Telegram с поддержкой HTML и разделения длинных текстов
 */
async function sendTelegramMessage(botToken, chatId, text) {
  try {
    const cleanText = text.slice(0, 4000); // Ограничение Telegram 4096 символов
    const res = await fetch(\`https://api.telegram.org/bot\${botToken}/sendMessage\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: cleanText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        link_preview_options: { is_disabled: true }
      })
    });
    return await res.json();
  } catch (err) {
    console.error(\`Failed to send message to \${chatId}:\`, err);
    return { ok: false, error: err.message };
  }
}

/**
 * =========================================================================
 * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ: XML/RSS Парсер, Хелперы D1, HTML
 * =========================================================================
 */
async function fetchAndParseRSS(url, source, category) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WindowsUpdateAIBot/1.0; +https://workers.cloudflare.com)' }
  });
  if (!res.ok) throw new Error(\`HTTP \${res.status} when fetching \${url}\`);
  const xml = await res.text();
  return parseSimpleRSS(xml, source, category);
}

function parseSimpleRSS(xml, source, category) {
  const items = [];
  const itemMatches = xml.match(/<item[\\s\\S]*?<\\/item>/gi) || xml.match(/<entry[\\s\\S]*?<\\/entry>/gi) || [];

  for (const itemXml of itemMatches) {
    const titleMatch = itemXml.match(/<title(?:[^>]*)>([\\s\\S]*?)<\\/title>/i);
    const linkMatch = itemXml.match(/<link(?:[^>]*)>([\\s\\S]*?)<\\/link>/i) || itemXml.match(/<link[^>]+href="([^"]+)"/i);
    const guidMatch = itemXml.match(/<guid(?:[^>]*)>([\\s\\S]*?)<\\/guid>/i) || itemXml.match(/<id(?:[^>]*)>([\\s\\S]*?)<\\/id>/i);
    const pubDateMatch = itemXml.match(/<pubDate(?:[^>]*)>([\\s\\S]*?)<\\/pubDate>/i) || itemXml.match(/<updated(?:[^>]*)>([\\s\\S]*?)<\\/updated>/i);
    const descMatch = itemXml.match(/<description(?:[^>]*)>([\\s\\S]*?)<\\/description>/i) || 
                      itemXml.match(/<content(?:[^>]*)>([\\s\\S]*?)<\\/content>/i) ||
                      itemXml.match(/<summary(?:[^>]*)>([\\s\\S]*?)<\\/summary>/i);

    const title = cleanXmlText(titleMatch ? titleMatch[1] : 'Без заголовка');
    let link = linkMatch ? (linkMatch[1] || linkMatch[0]) : '';
    link = cleanXmlText(link).replace(/<[^>]+>/g, '').trim();
    const guid = guidMatch ? cleanXmlText(guidMatch[1]) : (link || title);
    const pubDate = pubDateMatch ? cleanXmlText(pubDateMatch[1]) : new Date().toISOString();
    const rawContent = cleanXmlText(descMatch ? descMatch[1] : title);

    if (title && link) {
      items.push({ guid, title, link, pubDate, source, category, rawContent });
    }
  }
  return items;
}

function cleanXmlText(text) {
  if (!text) return '';
  return text
    .replace(/<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>/gi, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}

function isWindowsUpdateRelevant(title, content) {
  const keywords = ['windows', 'kb', 'insider', 'update', 'patch', 'build', '24h2', '23h2', '22h2', 'cumulative', 'security update', 'bsod', 'bug', 'fix'];
  const full = (title + ' ' + content).toLowerCase();
  return keywords.some(k => full.includes(k));
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function getSetting(db, key) {
  try {
    const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
    return row ? row.value : null;
  } catch (e) { return null; }
}

async function setSetting(db, key, value) {
  try {
    await db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP')
      .bind(key, value, value).run();
  } catch (e) {}
}

async function logToDB(db, level, message, details = '') {
  try {
    await db.prepare('INSERT INTO logs (level, message, details) VALUES (?, ?, ?)')
      .bind(level, message, details.slice(0, 1000)).run();
  } catch (e) {}
}

function renderDashboardHTML(env) {
  return \`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Windows Update AI Bot — Cloudflare Worker</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; max-width: 680px; margin: 0 auto; padding: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #38bdf8; display: flex; align-items: center; gap: 0.5rem; }
    p { color: #94a3b8; line-height: 1.6; }
    .badge { display: inline-block; padding: 4px 10px; background: #0284c7; color: white; border-radius: 9999px; font-size: 0.8rem; font-weight: bold; }
    .btn { display: inline-block; background: #2563eb; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 1rem; margin-right: 0.5rem; transition: 0.2s; }
    .btn:hover { background: #1d4ed8; }
    .btn-secondary { background: #334155; }
    .btn-secondary:hover { background: #475569; }
    pre { background: #090d16; padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; color: #a5f3fc; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Cloudflare Worker & D1 Active</span>
    <h1>🤖 Windows Update & Insider AI Telegram Bot</h1>
    <p>Сервис активен и отслеживает обновления Windows, инсайдерские сборки, ошибки и воркэраунды.</p>
    <hr style="border-color: #334155; margin: 1.5rem 0;">
    <h3>Быстрые действия:</h3>
    <a href="/set-webhook" class="btn" target="_blank">🔗 Привязать Webhook к Telegram</a>
    <a href="/check" class="btn btn-secondary" target="_blank">🔍 Запустить проверку лент (GET /check)</a>
    <a href="/test-post" class="btn btn-secondary" target="_blank">🚀 Отправить тест-пост (/test-post)</a>
    <h3 style="margin-top: 2rem;">Интеграция:</h3>
    <p>• D1 Binding: <code>DB</code><br>• Workers AI Binding: <code>AI</code><br>• Secret: <code>TELEGRAM_BOT_TOKEN</code></p>
  </div>
</body>
</html>\`;
}
`;
}

export function getWranglerToml(): string {
  return `# wrangler.toml (Справочно для тех, кто захочет деплоить через CLI)
name = "win-update-bot"
main = "worker.js"
compatibility_date = "2024-09-23"

# База данных D1
[[d1_databases]]
binding = "DB"
database_name = "win-update-bot"
database_id = "your-d1-database-id-here"

# Workers AI
[ai]
binding = "AI"

# Cron Triggers (каждые 30 минут)
[triggers]
crons = ["*/30 * * * *"]
`;
}
