CREATE TABLE IF NOT EXISTS updates (
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
