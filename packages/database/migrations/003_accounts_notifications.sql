ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('admin','agent'));
ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1));
ALTER TABLE properties ADD COLUMN assigned_user_id INTEGER REFERENCES users(id);
ALTER TABLE inquiries ADD COLUMN assigned_user_id INTEGER REFERENCES users(id);
CREATE INDEX properties_assigned_user ON properties(assigned_user_id);
CREATE INDEX inquiries_assigned_user ON inquiries(assigned_user_id);
CREATE TABLE password_resets(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
CREATE TABLE notifications(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 kind TEXT NOT NULL,
 recipient TEXT NOT NULL,
 subject TEXT NOT NULL,
 text TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending',
 attempts INTEGER NOT NULL DEFAULT 0,
 next_attempt INTEGER NOT NULL,
 expires INTEGER,
 sent_at TEXT,
 created_at TEXT NOT NULL,
 last_error TEXT NOT NULL DEFAULT ''
);
CREATE INDEX notifications_pending ON notifications(status,next_attempt);
