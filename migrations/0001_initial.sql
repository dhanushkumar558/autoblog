CREATE TABLE blogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  prompt TEXT NOT NULL,
  content_html TEXT NOT NULL,
  toc_html TEXT,
  excerpt TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'published',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX idx_blogs_slug ON blogs(slug);
CREATE INDEX idx_blogs_status ON blogs(status);
