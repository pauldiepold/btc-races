-- Schema für die BTC-Wettkampfanmeldung-App

-- Mitglieder-Tabelle
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wettkämpfe-Tabelle
CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT NOT NULL,
  registration_deadline DATE NOT NULL,
  announcement_link TEXT NOT NULL,
  description TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anmeldungen-Tabelle
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  verification_token UUID DEFAULT uuid_generate_v4(),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin-Tabelle (für Microsoft Entra ID Integration)
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entra_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- E-Mail-Vorlagen-Tabelle
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- E-Mail-Log-Tabelle
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES email_templates(id),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indizes für schnellere Abfragen
CREATE INDEX idx_registrations_member_id ON registrations(member_id);
CREATE INDEX idx_registrations_competition_id ON registrations(competition_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_competitions_date ON competitions(date);
CREATE INDEX idx_competitions_archived ON competitions(is_archived);

-- Beispiel für eine Sichteinschränkung (Row Level Security)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Policy für öffentlichen Lesezugriff auf Wettkämpfe
CREATE POLICY "Öffentlicher Lesezugriff auf aktive Wettkämpfe" 
  ON competitions FOR SELECT 
  USING (NOT is_archived);

-- Policy für Admin-Lesezugriff auf alle Tabellen
CREATE POLICY "Admin-Lesezugriff auf Mitglieder" 
  ON members FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin-Lesezugriff auf Wettkämpfe" 
  ON competitions FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin-Lesezugriff auf Anmeldungen" 
  ON registrations FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Policy für Admin-Schreibzugriff auf alle Tabellen
CREATE POLICY "Admin-Schreibzugriff auf Mitglieder" 
  ON members FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin-Schreibzugriff auf Wettkämpfe" 
  ON competitions FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin-Schreibzugriff auf Anmeldungen" 
  ON registrations FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Policies für Updates
CREATE POLICY "Admin-Update auf Mitglieder" 
  ON members FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin-Update auf Wettkämpfe" 
  ON competitions FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin-Update auf Anmeldungen" 
  ON registrations FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Policies für Löschoperationen
CREATE POLICY "Admin-Delete auf Mitglieder" 
  ON members FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin-Delete auf Wettkämpfe" 
  ON competitions FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin-Delete auf Anmeldungen" 
  ON registrations FOR DELETE
  USING (auth.role() = 'authenticated');

-- Policy für öffentliche Anmeldungen (ohne Login)
CREATE POLICY "Öffentliche Anmeldungen zu Wettkämpfen" 
  ON registrations FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM competitions c 
    WHERE c.id = competition_id 
      AND c.registration_deadline >= CURRENT_DATE
      AND NOT c.is_archived
  ));

-- Funktion für Aktualisierung des updated_at Feldes
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

-- Trigger für die Aktualisierung des updated_at Feldes
CREATE TRIGGER update_members_modtime
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_competitions_modtime
    BEFORE UPDATE ON competitions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_registrations_modtime
    BEFORE UPDATE ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_admins_modtime
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_email_templates_modtime
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column(); 