-- Seed data für competitions
INSERT INTO competitions (name, date, location, registration_deadline, announcement_link, description, is_archived)
VALUES
  (
    'Frühjahrs-Cup 2024',
    '2024-04-15',
    'Berlin Tempelhof',
    '2024-04-01',
    'https://example.com/fruehjahrscup2024',
    'Der traditionelle Frühjahrs-Cup mit spannenden Rennen für alle Altersklassen.',
    false
  ),
  (
    'Sommer Grand Prix',
    '2024-07-20',
    'München Olympiapark',
    '2024-07-05',
    'https://example.com/sommergp2024',
    'Großes Sommerrennen mit internationaler Beteiligung.',
    false
  ),
  (
    'Winter Challenge 2023',
    '2023-12-10',
    'Hamburg Stadtpark',
    '2023-11-25',
    'https://example.com/winter2023',
    'Die letzte große Herausforderung des Jahres.',
    true
  ),
  (
    'City Sprint 2024',
    '2024-06-01',
    null,
    '2024-05-15',
    null,
    'Schnelles Stadtrennen - Location wird noch bekannt gegeben.',
    false
  ); 