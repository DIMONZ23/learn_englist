BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  level VARCHAR(20) NOT NULL DEFAULT 'B1',
  streak_count INTEGER NOT NULL DEFAULT 0 CHECK (streak_count >= 0),
  last_study_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  learned_count INTEGER NOT NULL DEFAULT 0 CHECK (learned_count >= 0),
  exercises_count INTEGER NOT NULL DEFAULT 0 CHECK (exercises_count >= 0),
  correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  answer_count INTEGER NOT NULL DEFAULT 0 CHECK (answer_count >= 0),
  weekly_goal_percent INTEGER NOT NULL DEFAULT 0 CHECK (weekly_goal_percent BETWEEN 0 AND 100),
  weekly_change_percent INTEGER NOT NULL DEFAULT 0,
  daily_goal_minutes INTEGER NOT NULL DEFAULT 25 CHECK (daily_goal_minutes > 0),
  best_score NUMERIC(4,1) NOT NULL DEFAULT 0 CHECK (best_score BETWEEN 0 AND 10),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS daily_goal_minutes INTEGER NOT NULL DEFAULT 25 CHECK (daily_goal_minutes > 0);
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS best_score NUMERIC(4,1) NOT NULL DEFAULT 0 CHECK (best_score BETWEEN 0 AND 10);
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS weekly_change_percent INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS daily_reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  subtitle VARCHAR(240) NOT NULL,
  badge VARCHAR(80) NOT NULL,
  icon VARCHAR(16) NOT NULL DEFAULT 'A',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, sort_order)
);

CREATE TABLE IF NOT EXISTS vocabulary (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word VARCHAR(80) NOT NULL,
  ipa VARCHAR(120) NOT NULL DEFAULT '',
  word_type VARCHAR(40) NOT NULL DEFAULT 'word',
  meaning TEXT NOT NULL,
  definition TEXT NOT NULL DEFAULT '',
  example TEXT NOT NULL DEFAULT '',
  collocations JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(16) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'review', 'known')),
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS vocabulary_user_word_unique ON vocabulary(user_id, LOWER(word));
CREATE INDEX IF NOT EXISTS vocabulary_review_queue_idx ON vocabulary(user_id, status, next_review_at);

CREATE TABLE IF NOT EXISTS dictionary_entries (
  word VARCHAR(80) PRIMARY KEY,
  ipa VARCHAR(120) NOT NULL DEFAULT '',
  word_type VARCHAR(40) NOT NULL DEFAULT 'word',
  meaning TEXT NOT NULL,
  definition TEXT NOT NULL DEFAULT '',
  example TEXT NOT NULL DEFAULT '',
  collocations JSONB NOT NULL DEFAULT '[]'::jsonb,
  source VARCHAR(40) NOT NULL DEFAULT 'seed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grammar_lessons (
  lesson_key VARCHAR(80) PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  icon VARCHAR(16) NOT NULL DEFAULT '◇',
  title VARCHAR(160) NOT NULL,
  level VARCHAR(20) NOT NULL,
  content JSONB NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS practice_questions (
  id BIGSERIAL PRIMARY KEY,
  topic VARCHAR(100) NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index SMALLINT NOT NULL CHECK (correct_index BETWEEN 0 AND 10),
  explanation TEXT NOT NULL,
  traps JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS practice_topic_prompt_unique ON practice_questions(topic, prompt);
CREATE INDEX IF NOT EXISTS practice_topic_order_idx ON practice_questions(topic, sort_order);

CREATE TABLE IF NOT EXISTS practice_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES practice_questions(id) ON DELETE CASCADE,
  selected_index SMALLINT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS practice_attempts_user_date_idx ON practice_attempts(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS study_activity (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  minutes INTEGER NOT NULL DEFAULT 0 CHECK (minutes >= 0),
  completed_items INTEGER NOT NULL DEFAULT 0 CHECK (completed_items >= 0),
  UNIQUE(user_id, activity_date)
);

CREATE TABLE IF NOT EXISTS tutor_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id BIGINT REFERENCES practice_questions(id) ON DELETE SET NULL,
  role VARCHAR(16) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tutor_messages_user_date_idx ON tutor_messages(user_id, created_at DESC);

COMMIT;
