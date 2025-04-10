CREATE OR REPLACE FUNCTION create_competition(
  p_name TEXT,
  p_date DATE,
  p_location TEXT,
  p_registration_deadline DATE,
  p_announcement_link TEXT,
  p_description TEXT,
  p_max_participants INTEGER,
  p_categories TEXT
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO competitions (
    name,
    date,
    location,
    registration_deadline,
    announcement_link,
    description,
    max_participants,
    categories,
    is_archived
  ) VALUES (
    p_name,
    p_date,
    p_location,
    p_registration_deadline,
    p_announcement_link,
    p_description,
    p_max_participants,
    p_categories,
    FALSE
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 