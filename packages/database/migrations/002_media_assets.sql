CREATE TABLE IF NOT EXISTS media_assets (
 id TEXT PRIMARY KEY,
 provider TEXT NOT NULL CHECK(provider IN ('local','cloudinary')),
 public_id TEXT NOT NULL,
 url TEXT NOT NULL UNIQUE,
 format TEXT NOT NULL,
 bytes INTEGER NOT NULL,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS media_assets_provider ON media_assets(provider);
