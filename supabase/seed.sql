-- Seed data für competitions
INSERT INTO competitions (id, name, date, location, registration_deadline, announcement_link, description, registration_type, race_type, championship_type)
VALUES
  (
    1,
    'Frühjahrs-Cup 2025',
    '2025-05-15',
    'Berlin Tempelhof',
    '2025-05-01',
    'https://example.com/fruehjahrscup2025',
    'Der traditionelle Frühjahrs-Cup mit spannenden Rennen für alle Altersklassen.',
    'INDEPENDENT',
    'TRACK',
    'DM'
  ),
  (
    2,
    'Sommer Grand Prix 2025',
    '2025-07-20',
    'München Olympiapark',
    '2025-07-05',
    'https://example.com/sommergp2025',
    'Großes Sommerrennen mit internationaler Beteiligung.',
    'LADV',
    'ROAD',
    'BBM'
  ),
  (
    3,
    'Winter Challenge 2024',
    '2024-12-10',
    'Hamburg Stadtpark',
    '2024-11-25',
    'https://example.com/winter2024',
    'Die letzte große Herausforderung des Jahres 2024.',
    'CLUB',
    'TRACK',
    'NDM'
  ),
  (
    4,
    'City Sprint 2025',
    '2025-06-01',
    'Frankfurt Innenstadt',
    '2025-05-15',
    'https://example.com/citysprint2025',
    'Schnelles Stadtrennen durch die Frankfurter Innenstadt.',
    'LADV',
    'ROAD',
    'NO_CHAMPIONSHIP'
  ),
  (
    5,
    'Herbst Classic 2024',
    '2024-09-25',
    'Dresden Altstadt',
    '2024-09-10',
    'https://example.com/herbst2024',
    'Traditionelles Herbstrennen in der malerischen Dresdner Altstadt.',
    'INDEPENDENT',
    'TRACK',
    'DM'
  ),
  (
    6,
    'Rhein-Marathon 2026',
    '2026-08-30',
    'Düsseldorf Rheinufer',
    '2026-08-15',
    'https://example.com/rhein2026',
    'Spektakuläres Rennen entlang des Rheins.',
    'CLUB',
    'ROAD',
    'BBM'
  ),
  (
    7,
    'Alpen Trophy 2025',
    '2025-07-15',
    'Garmisch-Partenkirchen',
    '2025-06-30',
    'https://example.com/alpen2025',
    'Anspruchsvolles Bergrennen in den bayerischen Alpen.',
    'INDEPENDENT',
    'ROAD',
    'NDM'
  ),
  (
    8,
    'Nordsee Cup 2026',
    '2026-05-25',
    'St. Peter-Ording',
    '2026-05-10',
    'https://example.com/nordsee2026',
    'Einzigartiges Strandrennen an der Nordseeküste.',
    'LADV',
    'TRACK',
    'NO_CHAMPIONSHIP'
  ),
  (
    9,
    'Urban Challenge 2024',
    '2024-08-20',
    'Stuttgart Schlossplatz',
    '2024-08-05',
    'https://example.com/urban2024',
    'Urbanes Rennspektakel im Herzen Stuttgarts.',
    'CLUB',
    'ROAD',
    'DM'
  ),
  (
    10,
    'Winterzauber 2025',
    '2025-12-15',
    'Oberstdorf',
    '2025-11-30',
    'https://example.com/winter2025',
    'Magisches Winterrennen im verschneiten Allgäu.',
    'LADV',
    'TRACK',
    'BBM'
  ),
  (
    11,
    'Ruhr Classics 2026',
    '2026-10-08',
    'Essen Zeche Zollverein',
    '2026-09-23',
    'https://example.com/ruhr2026',
    'Historisches Rennen im Ruhrgebiet.',
    'INDEPENDENT',
    'ROAD',
    'NDM'
  ),
  (
    12,
    'Frühlings Revival 2026',
    '2026-03-10',
    'Leipzig',
    '2026-02-24',
    'https://example.com/leipzig2026',
    'Saisonauftakt in der Messestadt.',
    'CLUB',
    'TRACK',
    'NO_CHAMPIONSHIP'
  ),
  (
    13,
    'Harz Adventure 2024',
    '2024-06-18',
    'Wernigerode',
    '2024-06-03',
    'https://example.com/harz2024',
    'Abenteuerliches Rennen durch den Harz.',
    'INDEPENDENT',
    'ROAD',
    'DM'
  ),
  (
    14,
    'Ostsee Challenge 2025',
    '2025-09-08',
    'Rostock',
    '2025-08-24',
    'https://example.com/ostsee2025',
    'Maritimes Rennerlebnis an der Ostseeküste.',
    'LADV',
    'TRACK',
    'BBM'
  ),
  (
    15,
    'Black Forest Cup 2026',
    '2026-10-20',
    'Freiburg',
    '2026-10-05',
    'https://example.com/blackforest2026',
    'Herbstliches Rennen durch den Schwarzwald.',
    'CLUB',
    'ROAD',
    'NDM'
  );

-- Erste 40 Mitglieder behalten
INSERT INTO "public"."members" ("id", "name", "created_at", "updated_at", "has_left") 
VALUES 
  ('1', 'Florens v.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('3', 'Björn T.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('5', 'Benjamin S.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('6', 'Jonas M.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('7', 'Noa S.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('9', 'Nele T.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('14', 'Fabian K.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('16', 'Britta H.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('17', 'Jana S.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('18', 'Hannah P.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('20', 'Lisa Felicitas R.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('21', 'Nikolas H.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('22', 'Cheryl Joy W.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('24', 'Caroline F.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('25', 'Vikas Kumar L.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('27', 'Frederik W.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('28', 'Frederike v.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('29', 'Mark P.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('30', 'Jesaja B.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('32', 'Noah L.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('34', 'Clara S.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('36', 'Maja S.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('37', 'Linda W.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('39', 'Mareike D.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('42', 'Ayna A.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('43', 'Wendall L.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('44', 'Tobias S.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('45', 'Yoann L.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('46', 'Tim M.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('47', 'Lukas H.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('49', 'Lukas K.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('51', 'Shirley F.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('54', 'Caroline S.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('57', 'Samalya S.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('58', 'Carlotta W.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('59', 'Kevin K.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('60', 'Miguel G.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('61', 'Paul D.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('62', 'Eric B.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('63', 'Andréas D.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false'),
  ('64', 'Theo D.', '2025-04-14 16:07:05.795343+00', '2025-04-14 16:07:05.53+00', 'false');

-- Anonymisierte E-Mails für die ersten 40 Mitglieder
INSERT INTO "public"."emails" ("id", "created_at", "email", "member_id") 
VALUES 
  ('905', '2025-04-14 16:07:06.098447+00', 'member001@example.com', '1'),
  ('906', '2025-04-14 16:07:06.098447+00', 'member002@example.com', '3'),
  ('907', '2025-04-14 16:07:06.098447+00', 'member003@example.com', '5'),
  ('908', '2025-04-14 16:07:06.098447+00', 'member004@example.com', '6'),
  ('909', '2025-04-14 16:07:06.098447+00', 'member005@example.com', '7'),
  ('910', '2025-04-14 16:07:06.098447+00', 'member006@example.com', '9'),
  ('911', '2025-04-14 16:07:06.098447+00', 'member007@example.com', '14'),
  ('912', '2025-04-14 16:07:06.098447+00', 'member008@example.com', '16'),
  ('913', '2025-04-14 16:07:06.098447+00', 'member009@example.com', '17'),
  ('914', '2025-04-14 16:07:06.098447+00', 'member010@example.com', '18'),
  ('915', '2025-04-14 16:07:06.098447+00', 'member011@example.com', '20'),
  ('916', '2025-04-14 16:07:06.098447+00', 'member012@example.com', '21'),
  ('917', '2025-04-14 16:07:06.098447+00', 'member013@example.com', '22'),
  ('918', '2025-04-14 16:07:06.098447+00', 'member014@example.com', '24'),
  ('919', '2025-04-14 16:07:06.098447+00', 'member015@example.com', '25'),
  ('920', '2025-04-14 16:07:06.098447+00', 'member016@example.com', '27'),
  ('921', '2025-04-14 16:07:06.098447+00', 'member017@example.com', '28'),
  ('922', '2025-04-14 16:07:06.098447+00', 'member018@example.com', '29'),
  ('923', '2025-04-14 16:07:06.098447+00', 'member019@example.com', '30'),
  ('924', '2025-04-14 16:07:06.098447+00', 'member020@example.com', '32'),
  ('925', '2025-04-14 16:07:06.098447+00', 'member021@example.com', '34'),
  ('926', '2025-04-14 16:07:06.098447+00', 'member022@example.com', '36'),
  ('927', '2025-04-14 16:07:06.098447+00', 'member023@example.com', '37'),
  ('928', '2025-04-14 16:07:06.098447+00', 'member024@example.com', '39'),
  ('929', '2025-04-14 16:07:06.098447+00', 'member025@example.com', '42'),
  ('930', '2025-04-14 16:07:06.098447+00', 'member026@example.com', '43'),
  ('931', '2025-04-14 16:07:06.098447+00', 'member027@example.com', '44'),
  ('932', '2025-04-14 16:07:06.098447+00', 'member028@example.com', '45'),
  ('933', '2025-04-14 16:07:06.098447+00', 'member029@example.com', '46'),
  ('934', '2025-04-14 16:07:06.098447+00', 'member030@example.com', '47'),
  ('935', '2025-04-14 16:07:06.098447+00', 'member031@example.com', '49'),
  ('936', '2025-04-14 16:07:06.098447+00', 'member032@example.com', '51'),
  ('937', '2025-04-14 16:07:06.098447+00', 'member033@example.com', '54'),
  ('938', '2025-04-14 16:07:06.098447+00', 'member034@example.com', '57'),
  ('939', '2025-04-14 16:07:06.098447+00', 'member035@example.com', '58'),
  ('940', '2025-04-14 16:07:06.098447+00', 'member036@example.com', '59'),
  ('941', '2025-04-14 16:07:06.098447+00', 'member037@example.com', '60'),
  ('942', '2025-04-14 16:07:06.098447+00', 'member038@example.com', '61'),
  ('943', '2025-04-14 16:07:06.098447+00', 'member039@example.com', '62'),
  ('944', '2025-04-14 16:07:06.098447+00', 'member040@example.com', '63');

-- Registrierungen mit zufälligen Verknüpfungen
INSERT INTO "public"."registrations" ("id", "competition_id", "member_id", "status", "notes", "verification_token", "verified_at", "created_at", "updated_at")
VALUES
  (1, 1, 1, 'confirmed', 'Teilnahme bestätigt', 'token1', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (2, 2, 3, 'pending', NULL, 'token2', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (3, 3, 5, 'confirmed', 'Startnummer 42', 'token3', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (4, 4, 6, 'canceled', 'Verletzung', 'token4', NULL, '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (5, 5, 7, 'pending', NULL, 'token5', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (6, 6, 9, 'confirmed', 'VIP Start', 'token6', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (7, 7, 14, 'canceled', 'Terminkonflikt', 'token7', NULL, '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (8, 8, 16, 'pending', NULL, 'token8', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (9, 9, 17, 'confirmed', 'Gruppenstart', 'token9', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (10, 10, 18, 'canceled', 'Krankheit', 'token10', NULL, '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (11, 11, 20, 'pending', NULL, 'token11', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (12, 12, 21, 'confirmed', 'Elite Start', 'token12', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (13, 13, 22, 'pending', NULL, 'token13', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (14, 14, 24, 'canceled', 'Umzug', 'token14', NULL, '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (15, 15, 25, 'confirmed', 'Startblock A', 'token15', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (16, 1, 27, 'pending', NULL, 'token16', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (17, 2, 28, 'canceled', 'Verletzung', 'token17', NULL, '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (18, 3, 29, 'confirmed', 'Startnummer 101', 'token18', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (19, 4, 30, 'pending', NULL, 'token19', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (20, 5, 32, 'canceled', 'Terminkonflikt', 'token20', NULL, '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (21, 6, 34, 'confirmed', 'Startblock B', 'token21', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (22, 7, 36, 'pending', NULL, 'token22', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (23, 8, 37, 'confirmed', 'VIP Start', 'token23', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (24, 9, 39, 'canceled', 'Krankheit', 'token24', NULL, '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (25, 10, 42, 'pending', NULL, 'token25', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (26, 11, 43, 'confirmed', 'Gruppenstart', 'token26', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (27, 12, 44, 'pending', NULL, 'token27', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (28, 13, 45, 'confirmed', 'Startnummer 77', 'token28', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (29, 14, 46, 'canceled', 'Verletzung', 'token29', NULL, '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (30, 15, 47, 'pending', NULL, 'token30', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (31, 1, 49, 'confirmed', 'Startblock C', 'token31', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (32, 2, 51, 'pending', NULL, 'token32', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (33, 3, 54, 'confirmed', 'Elite Start', 'token33', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (34, 4, 57, 'canceled', 'Terminkonflikt', 'token34', NULL, '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (35, 5, 58, 'pending', NULL, 'token35', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (36, 6, 59, 'confirmed', 'Startnummer 55', 'token36', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (37, 7, 60, 'pending', NULL, 'token37', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (38, 8, 61, 'confirmed', 'VIP Start', 'token38', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (39, 9, 62, 'canceled', 'Krankheit', 'token39', NULL, '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (40, 10, 63, 'pending', NULL, 'token40', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (41, 11, 1, 'confirmed', 'Gruppenstart', 'token41', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (42, 12, 3, 'pending', NULL, 'token42', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (43, 13, 5, 'canceled', 'Verletzung', 'token43', NULL, '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (44, 14, 6, 'confirmed', 'Startnummer 88', 'token44', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (45, 15, 7, 'pending', NULL, 'token45', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (46, 1, 9, 'confirmed', 'Startblock D', 'token46', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (47, 2, 14, 'pending', NULL, 'token47', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (48, 3, 16, 'confirmed', 'Elite Start', 'token48', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (49, 4, 17, 'canceled', 'Terminkonflikt', 'token49', NULL, '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (50, 5, 18, 'pending', NULL, 'token50', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (51, 6, 20, 'confirmed', 'Startnummer 33', 'token51', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (52, 7, 21, 'pending', NULL, 'token52', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (53, 8, 22, 'confirmed', 'VIP Start', 'token53', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (54, 9, 24, 'canceled', 'Krankheit', 'token54', NULL, '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (55, 10, 25, 'pending', NULL, 'token55', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (56, 11, 27, 'confirmed', 'Gruppenstart', 'token56', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (57, 12, 28, 'pending', NULL, 'token57', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (58, 13, 29, 'confirmed', 'Startnummer 66', 'token58', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (59, 14, 30, 'canceled', 'Verletzung', 'token59', NULL, '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (60, 15, 32, 'pending', NULL, 'token60', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (61, 1, 34, 'confirmed', 'Startblock E', 'token61', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (62, 2, 36, 'pending', NULL, 'token62', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (63, 3, 37, 'confirmed', 'Elite Start', 'token63', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (64, 4, 39, 'canceled', 'Terminkonflikt', 'token64', NULL, '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (65, 5, 42, 'pending', NULL, 'token65', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (66, 6, 43, 'confirmed', 'Startnummer 99', 'token66', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (67, 7, 44, 'pending', NULL, 'token67', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (68, 8, 45, 'confirmed', 'VIP Start', 'token68', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (69, 9, 46, 'canceled', 'Krankheit', 'token69', NULL, '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (70, 10, 47, 'pending', NULL, 'token70', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (71, 11, 49, 'confirmed', 'Gruppenstart', 'token71', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (72, 12, 51, 'pending', NULL, 'token72', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (73, 13, 54, 'confirmed', 'Startnummer 11', 'token73', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (74, 14, 57, 'canceled', 'Verletzung', 'token74', NULL, '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (75, 15, 58, 'pending', NULL, 'token75', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (76, 1, 59, 'confirmed', 'Startblock F', 'token76', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (77, 2, 60, 'pending', NULL, 'token77', NULL, '2025-04-14 16:07:06.098447+00', NULL),
  (78, 3, 61, 'confirmed', 'Elite Start', 'token78', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (79, 4, 62, 'canceled', 'Terminkonflikt', 'token79', NULL, '2025-04-14 16:07:06.098447+00', '2025-04-14 16:07:06.098447+00'),
  (80, 5, 63, 'pending', NULL, 'token80', NULL, '2025-04-14 16:07:06.098447+00', NULL);

-- Setze die Sequenzen auf die höchsten vorhandenen IDs
SELECT setval('public.competitions_id_seq', (SELECT MAX(id::bigint) FROM competitions));
SELECT setval('public.members_id_seq', (SELECT MAX(id::bigint) FROM members));
SELECT setval('public.emails_id_seq', (SELECT MAX(id::bigint) FROM emails));
SELECT setval('public.registrations_id_seq', (SELECT MAX(id::bigint) FROM registrations));
