CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  date DATE NOT NULL,
  registration_deadline DATE NOT NULL,
  announcement_link TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

-- Policy für öffentliches Lesen
CREATE POLICY "Competitions sind öffentlich lesbar" ON competitions
  FOR SELECT
  TO public
  USING (true);

-- Policy für authentifizierte Benutzer
CREATE POLICY "Authentifizierte Benutzer dürfen Competitions bearbeiten" ON competitions
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');