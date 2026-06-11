CREATE TABLE IF NOT EXISTS profiles (
  username TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  "avatarUrl" TEXT NOT NULL DEFAULT '',
  "lastSync" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  "imagePath" TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  position INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "profileUsername" TEXT NOT NULL REFERENCES profiles(username) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_posts_profile ON posts ("profileUsername");
