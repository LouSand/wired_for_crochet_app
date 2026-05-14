-- Medium features: knitting support, project templates, stitch dictionary, sharing gallery, notifications

-- ─── Knitting Support: Needles table ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS needle_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  size varchar(20) NOT NULL,
  type varchar(50) CHECK (type IN ('straight', 'circular', 'dpn', 'interchangeable', 'cable', 'other')),
  length varchar(30),
  brand varchar(255),
  material varchar(100),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE needle_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own needles" ON needle_entries FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Add craft_type to projects and patterns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS craft_type varchar(20) DEFAULT 'crochet' CHECK (craft_type IN ('crochet', 'knitting', 'both'));
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS craft_type varchar(20) DEFAULT 'crochet' CHECK (craft_type IN ('crochet', 'knitting', 'both'));

-- ─── Project Templates ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  description text,
  craft_type varchar(20) DEFAULT 'crochet',
  pattern_id uuid REFERENCES patterns(id) ON DELETE SET NULL,
  counters jsonb NOT NULL DEFAULT '[]',
  hooks jsonb NOT NULL DEFAULT '[]',
  yarn jsonb NOT NULL DEFAULT '[]',
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own templates" ON project_templates FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── Stitch Dictionary ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stitch_dictionary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_uk varchar(100) NOT NULL,
  name_us varchar(100) NOT NULL,
  abbreviation_uk varchar(20),
  abbreviation_us varchar(20),
  craft_type varchar(20) NOT NULL DEFAULT 'crochet' CHECK (craft_type IN ('crochet', 'knitting', 'both')),
  category varchar(30) CHECK (category IN ('basic', 'intermediate', 'advanced', 'decorative', 'structural')),
  description text,
  instructions text,
  difficulty varchar(20) CHECK (difficulty IN ('beginner', 'easy', 'intermediate', 'advanced', 'expert')),
  is_system boolean NOT NULL DEFAULT true,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- System stitches are viewable by all, user stitches only by owner
ALTER TABLE stitch_dictionary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view system stitches" ON stitch_dictionary FOR SELECT USING (is_system = true);
CREATE POLICY "Users manage own custom stitches" ON stitch_dictionary FOR ALL USING (user_id = auth.uid() OR is_system = true) WITH CHECK (user_id = auth.uid());

-- Seed basic crochet stitches
INSERT INTO stitch_dictionary (name_uk, name_us, abbreviation_uk, abbreviation_us, craft_type, category, difficulty, description) VALUES
  ('Chain', 'Chain', 'ch', 'ch', 'crochet', 'basic', 'beginner', 'Foundation stitch. Yarn over, pull through loop.'),
  ('Slip Stitch', 'Slip Stitch', 'sl st', 'sl st', 'crochet', 'basic', 'beginner', 'Insert hook, yarn over, pull through both loops.'),
  ('Double Crochet', 'Single Crochet', 'dc', 'sc', 'crochet', 'basic', 'beginner', 'Insert hook, yarn over, pull through, yarn over, pull through both loops.'),
  ('Half Treble', 'Half Double Crochet', 'htr', 'hdc', 'crochet', 'basic', 'easy', 'Yarn over, insert hook, yarn over, pull through, yarn over, pull through all 3 loops.'),
  ('Treble', 'Double Crochet', 'tr', 'dc', 'crochet', 'basic', 'easy', 'Yarn over, insert hook, yarn over, pull through, (yarn over, pull through 2) twice.'),
  ('Double Treble', 'Treble Crochet', 'dtr', 'tr', 'crochet', 'intermediate', 'intermediate', 'Yarn over twice, insert hook, yarn over, pull through, (yarn over, pull through 2) three times.'),
  ('Increase', 'Increase', 'inc', 'inc', 'crochet', 'structural', 'beginner', 'Work two stitches into the same stitch.'),
  ('Decrease', 'Decrease', 'dec', 'dec', 'crochet', 'structural', 'easy', 'Work two stitches together to reduce stitch count.'),
  ('Bobble', 'Bobble', 'bob', 'bob', 'crochet', 'decorative', 'advanced', 'Multiple incomplete stitches in same stitch, joined at top.'),
  ('Popcorn', 'Popcorn', 'pc', 'pc', 'crochet', 'decorative', 'advanced', 'Complete stitches in same stitch, fold and join.'),
  ('Front Post', 'Front Post', 'fp', 'fp', 'crochet', 'intermediate', 'intermediate', 'Work around the post of the stitch from the front.'),
  ('Back Post', 'Back Post', 'bp', 'bp', 'crochet', 'intermediate', 'intermediate', 'Work around the post of the stitch from the back.'),
  ('Knit', 'Knit', 'k', 'k', 'knitting', 'basic', 'beginner', 'Insert needle front to back, wrap yarn, pull through.'),
  ('Purl', 'Purl', 'p', 'p', 'knitting', 'basic', 'beginner', 'Insert needle back to front, wrap yarn, pull through.'),
  ('Knit Two Together', 'Knit Two Together', 'k2tog', 'k2tog', 'knitting', 'structural', 'easy', 'Right-leaning decrease. Knit two stitches as one.'),
  ('Slip Slip Knit', 'Slip Slip Knit', 'ssk', 'ssk', 'knitting', 'structural', 'easy', 'Left-leaning decrease. Slip 2, knit together through back loops.'),
  ('Yarn Over', 'Yarn Over', 'yo', 'yo', 'knitting', 'basic', 'easy', 'Wrap yarn around needle to create a new stitch and eyelet hole.'),
  ('Cable', 'Cable', 'C', 'C', 'knitting', 'decorative', 'intermediate', 'Cross stitches over each other using a cable needle.')
ON CONFLICT DO NOTHING;

-- ─── Sharing / Inspiration Gallery ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shared_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  photo_path text,
  caption text,
  pattern_id uuid REFERENCES patterns(id) ON DELETE SET NULL,
  craft_type varchar(20),
  yarn_used text,
  time_taken_seconds integer,
  is_public boolean NOT NULL DEFAULT true,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

ALTER TABLE shared_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public shared projects" ON shared_projects FOR SELECT USING (is_public = true);
CREATE POLICY "Users manage own shared projects" ON shared_projects FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS inspiration_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_project_id uuid NOT NULL REFERENCES shared_projects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, shared_project_id)
);

ALTER TABLE inspiration_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own likes" ON inspiration_likes FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Anyone can view likes" ON inspiration_likes FOR SELECT USING (true);

-- ─── Notifications ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL,
  title varchar(255) NOT NULL,
  message text,
  link varchar(500),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notifications" ON user_notifications FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON user_notifications(user_id, is_read) WHERE is_read = false;

-- ─── Data Export Log ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS data_export_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type varchar(50) NOT NULL DEFAULT 'full_backup',
  status varchar(20) NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE data_export_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own exports" ON data_export_log FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
