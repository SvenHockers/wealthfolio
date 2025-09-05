-- Remove enabled column from platforms (SQLite limitation: recreate table)

PRAGMA foreign_keys=off;

CREATE TABLE platforms_backup (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT,
  url TEXT NOT NULL
);

INSERT INTO platforms_backup (id, name, url)
SELECT id, name, url FROM platforms;

DROP TABLE platforms;

CREATE TABLE platforms (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT,
  url TEXT NOT NULL
);

INSERT INTO platforms (id, name, url)
SELECT id, name, url FROM platforms_backup;

DROP TABLE platforms_backup;

PRAGMA foreign_keys=on;


