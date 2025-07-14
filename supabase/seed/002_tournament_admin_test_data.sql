-- Tournament Admin Test Data
-- This file contains test data for tournament administration functionality

-- Insert test players with tournament admin fields
INSERT INTO players (id, name, nickname, email, profile_picture, hometown, state, current_town, current_state, championships_won, created_at, updated_at) VALUES
-- Group 1: Chicago players
('550e8400-e29b-41d4-a716-446655440001', 'Alice Johnson', 'AJ', 'alice.johnson@email.com', 'https://i.pravatar.cc/150?u=alice.johnson', 'Chicago', 'IL', 'Chicago', 'IL', 2, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Bob Smith', 'Bobby', 'bob.smith@email.com', 'https://i.pravatar.cc/150?u=bob.smith', 'Chicago', 'IL', 'Evanston', 'IL', 1, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Charlie Brown', 'Chuck', 'charlie.brown@email.com', 'https://i.pravatar.cc/150?u=charlie.brown', 'Chicago', 'IL', 'Oak Park', 'IL', 0, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Diana Prince', 'Wonder', 'diana.prince@email.com', 'https://i.pravatar.cc/150?u=diana.prince', 'Chicago', 'IL', 'Chicago', 'IL', 3, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Eve Williams', 'Evie', 'eve.williams@email.com', 'https://i.pravatar.cc/150?u=eve.williams', 'Chicago', 'IL', 'Naperville', 'IL', 1, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'Frank Castle', 'Punisher', 'frank.castle@email.com', 'https://i.pravatar.cc/150?u=frank.castle', 'Chicago', 'IL', 'Schaumburg', 'IL', 0, NOW(), NOW()),

-- Group 2: New York players
('550e8400-e29b-41d4-a716-446655440007', 'Grace Hopper', 'Amazing', 'grace.hopper@email.com', 'https://i.pravatar.cc/150?u=grace.hopper', 'New York', 'NY', 'Brooklyn', 'NY', 4, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440008', 'Henry Ford', 'Hank', 'henry.ford@email.com', 'https://i.pravatar.cc/150?u=henry.ford', 'Detroit', 'MI', 'Manhattan', 'NY', 2, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440009', 'Iris West', 'Flash', 'iris.west@email.com', 'https://i.pravatar.cc/150?u=iris.west', 'Central City', 'MO', 'Queens', 'NY', 1, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440010', 'Jack Sparrow', 'Captain', 'jack.sparrow@email.com', 'https://i.pravatar.cc/150?u=jack.sparrow', 'Port Royal', 'JM', 'Staten Island', 'NY', 0, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440011', 'Karen Page', 'KP', 'karen.page@email.com', 'https://i.pravatar.cc/150?u=karen.page', 'Vermont', 'VT', 'Bronx', 'NY', 1, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440012', 'Luke Skywalker', 'Jedi', 'luke.skywalker@email.com', 'https://i.pravatar.cc/150?u=luke.skywalker', 'Tatooine', 'GAL', 'Albany', 'NY', 3, NOW(), NOW()),

-- Group 3: California players
('550e8400-e29b-41d4-a716-446655440013', 'Maya Angelou', 'Poet', 'maya.angelou@email.com', 'https://i.pravatar.cc/150?u=maya.angelou', 'St. Louis', 'MO', 'San Francisco', 'CA', 2, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440014', 'Neil Armstrong', 'Astronaut', 'neil.armstrong@email.com', 'https://i.pravatar.cc/150?u=neil.armstrong', 'Ohio', 'OH', 'Los Angeles', 'CA', 1, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440015', 'Oprah Winfrey', 'O', 'oprah.winfrey@email.com', 'https://i.pravatar.cc/150?u=oprah.winfrey', 'Mississippi', 'MS', 'Santa Barbara', 'CA', 5, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440016', 'Peter Parker', 'Spider', 'peter.parker@email.com', 'https://i.pravatar.cc/150?u=peter.parker', 'New York', 'NY', 'San Diego', 'CA', 0, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440017', 'Quincy Jones', 'Q', 'quincy.jones@email.com', 'https://i.pravatar.cc/150?u=quincy.jones', 'Chicago', 'IL', 'Sacramento', 'CA', 2, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440018', 'Rosa Parks', 'Brave', 'rosa.parks@email.com', 'https://i.pravatar.cc/150?u=rosa.parks', 'Alabama', 'AL', 'Oakland', 'CA', 1, NOW(), NOW()),

-- Group 4: Texas players  
('550e8400-e29b-41d4-a716-446655440019', 'Steve Jobs', 'Visionary', 'steve.jobs@email.com', 'https://i.pravatar.cc/150?u=steve.jobs', 'California', 'CA', 'Austin', 'TX', 3, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440020', 'Tina Turner', 'Queen', 'tina.turner@email.com', 'https://i.pravatar.cc/150?u=tina.turner', 'Tennessee', 'TN', 'Houston', 'TX', 4, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440021', 'Uma Thurman', 'Kiddo', 'uma.thurman@email.com', 'https://i.pravatar.cc/150?u=uma.thurman', 'Boston', 'MA', 'Dallas', 'TX', 0, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440022', 'Vincent Van Gogh', 'Painter', 'vincent.vangogh@email.com', 'https://i.pravatar.cc/150?u=vincent.vangogh', 'Netherlands', 'NL', 'San Antonio', 'TX', 1, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440023', 'Wonder Woman', 'Amazon', 'wonder.woman@email.com', 'https://i.pravatar.cc/150?u=wonder.woman', 'Paradise Island', 'PI', 'Fort Worth', 'TX', 6, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440024', 'Xavier Professor', 'ProfX', 'xavier.professor@email.com', 'https://i.pravatar.cc/150?u=xavier.professor', 'New York', 'NY', 'El Paso', 'TX', 2, NOW(), NOW());

-- Insert test tournaments
INSERT INTO tournaments (id, name, description, start_date, end_date, status, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Baseball X - Fall Tournament 2024', 'Annual fall tournament with expanded teams', '2024-10-15', '2024-10-17', 'upcoming', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440002', 'Spring Training Championship 2024', 'Pre-season tournament for skill development', '2024-03-20', '2024-03-22', 'completed', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440003', 'Summer League Tournament 2024', 'Mid-season competitive tournament', '2024-07-10', '2024-07-12', 'completed', NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440004', 'Winter Classic 2024', 'End-of-year championship tournament', '2024-12-15', '2024-12-17', 'upcoming', NOW(), NOW());

-- Insert test teams
INSERT INTO teams (id, name, color, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'The Ringers', '#FF6B6B', NOW()),
('770e8400-e29b-41d4-a716-446655440002', 'Clutch Hitters', '#4ECDC4', NOW()),
('770e8400-e29b-41d4-a716-446655440003', 'Home Run Heroes', '#45B7D1', NOW()),
('770e8400-e29b-41d4-a716-446655440004', 'Power Sluggers', '#FFA07A', NOW()),
('770e8400-e29b-41d4-a716-446655440005', 'Diamond Dogs', '#98D8C8', NOW()),
('770e8400-e29b-41d4-a716-446655440006', 'Thunder Bolts', '#F06292', NOW()),
('770e8400-e29b-41d4-a716-446655440007', 'The Crushers', '#AED581', NOW()),
('770e8400-e29b-41d4-a716-446655440008', 'Fast Ballers', '#FFB74D', NOW());

-- Insert tournament configurations
INSERT INTO tournament_configurations (id, tournament_id, pool_play_games, pool_play_innings, bracket_type, bracket_innings, final_innings, team_size, is_active, settings_locked, created_at, updated_at) VALUES
('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 3, 7, 'single_elimination', 7, 9, 6, false, false, NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 2, 5, 'double_elimination', 7, 9, 4, false, true, NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 4, 7, 'single_elimination', 7, 9, 5, false, true, NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 2, 7, 'double_elimination', 9, 9, 6, false, false, NOW(), NOW());

-- Insert team assignments for Fall Tournament 2024
INSERT INTO team_assignments (id, tournament_id, team_id, team_name, player_ids, is_locked, created_at, updated_at) VALUES
('990e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'The Ringers', 
 ARRAY['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 
       '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006'], 
 false, NOW(), NOW()),

('990e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 'Clutch Hitters', 
 ARRAY['550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440009', 
       '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440012'], 
 false, NOW(), NOW()),

('990e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 'Home Run Heroes', 
 ARRAY['550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440015', 
       '550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440018'], 
 false, NOW(), NOW()),

('990e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440004', 'Power Sluggers', 
 ARRAY['550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440021', 
       '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440024'], 
 false, NOW(), NOW());

-- Insert team assignments for Spring Training Championship 2024 (smaller teams)
INSERT INTO team_assignments (id, tournament_id, team_id, team_name, player_ids, is_locked, created_at, updated_at) VALUES
('990e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440005', 'Diamond Dogs', 
 ARRAY['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440019'], 
 true, NOW(), NOW()),

('990e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440006', 'Thunder Bolts', 
 ARRAY['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440020'], 
 true, NOW(), NOW()),

('990e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440007', 'The Crushers', 
 ARRAY['550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440021'], 
 true, NOW(), NOW()),

('990e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440008', 'Fast Ballers', 
 ARRAY['550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440022'], 
 true, NOW(), NOW());

-- Insert team memberships for the tournaments (linking players to teams)
INSERT INTO team_memberships (id, team_id, player_id, tournament_id) VALUES
-- Fall Tournament 2024 - The Ringers
('aa0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440001'),

-- Fall Tournament 2024 - Clutch Hitters
('aa0e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440009', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440010', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440011', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440012', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440001'),

-- Fall Tournament 2024 - Home Run Heroes
('aa0e8400-e29b-41d4-a716-446655440013', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440014', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440015', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440016', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440016', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440017', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440017', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440018', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440018', '660e8400-e29b-41d4-a716-446655440001'),

-- Fall Tournament 2024 - Power Sluggers
('aa0e8400-e29b-41d4-a716-446655440019', '770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440019', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440020', '770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440020', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440021', '770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440021', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440022', '770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440022', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440023', '770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440023', '660e8400-e29b-41d4-a716-446655440001'),
('aa0e8400-e29b-41d4-a716-446655440024', '770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440024', '660e8400-e29b-41d4-a716-446655440001'),

-- Spring Training Championship 2024 - Diamond Dogs
('aa0e8400-e29b-41d4-a716-446655440025', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002'),
('aa0e8400-e29b-41d4-a716-446655440026', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440002'),
('aa0e8400-e29b-41d4-a716-446655440027', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440002'),
('aa0e8400-e29b-41d4-a716-446655440028', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440019', '660e8400-e29b-41d4-a716-446655440002'),

-- Spring Training Championship 2024 - Thunder Bolts
('aa0e8400-e29b-41d4-a716-446655440029', '770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002'),
('aa0e8400-e29b-41d4-a716-446655440030', '770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440002'),
('aa0e8400-e29b-41d4-a716-446655440031', '770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440002'),
('aa0e8400-e29b-41d4-a716-446655440032', '770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440020', '660e8400-e29b-41d4-a716-446655440002'),

-- Spring Training Championship 2024 - The Crushers
('aa0e8400-e29b-41d4-a716-446655440033', '770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002'),
('aa0e8400-e29b-41d4-a716-446655440034', '770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440002'),
('aa0e8400-e29b-41d4-a716-446655440035', '770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440002'),
('aa0e8400-e29b-41d4-a716-446655440036', '770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440021', '660e8400-e29b-41d4-a716-446655440002'),

-- Spring Training Championship 2024 - Fast Ballers
('aa0e8400-e29b-41d4-a716-446655440037', '770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002'),
('aa0e8400-e29b-41d4-a716-446655440038', '770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440002'),
('aa0e8400-e29b-41d4-a716-446655440039', '770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440016', '660e8400-e29b-41d4-a716-446655440002'),
('aa0e8400-e29b-41d4-a716-446655440040', '770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440022', '660e8400-e29b-41d4-a716-446655440002');

-- Insert some sample games for testing standings
INSERT INTO games (id, tournament_id, home_team_id, away_team_id, home_score, away_score, current_inning, is_top_inning, total_innings, status, started_at, completed_at, created_at, updated_at) VALUES
-- Spring Training Championship 2024 - completed games
('bb0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440006', 7, 4, 7, false, 7, 'completed', '2024-03-20 10:00:00', '2024-03-20 11:30:00', NOW(), NOW()),
('bb0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440008', 5, 8, 7, false, 7, 'completed', '2024-03-20 12:00:00', '2024-03-20 13:30:00', NOW(), NOW()),
('bb0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440007', 6, 3, 7, false, 7, 'completed', '2024-03-20 14:00:00', '2024-03-20 15:30:00', NOW(), NOW()),
('bb0e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440008', 9, 2, 7, false, 7, 'completed', '2024-03-20 16:00:00', '2024-03-20 17:30:00', NOW(), NOW()),
('bb0e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440008', 4, 6, 7, false, 7, 'completed', '2024-03-21 10:00:00', '2024-03-21 11:30:00', NOW(), NOW()),
('bb0e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440007', 7, 7, 9, false, 7, 'completed', '2024-03-21 12:00:00', '2024-03-21 14:00:00', NOW(), NOW());

-- Insert tournament standings for testing
INSERT INTO tournament_standings (id, tournament_id, team_id, wins, losses, runs_scored, runs_allowed, updated_at) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440005', 2, 1, 17, 13, NOW()),
('cc0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440006', 2, 1, 20, 13, NOW()),
('cc0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440007', 1, 2, 15, 18, NOW()),
('cc0e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440008', 1, 2, 16, 24, NOW()); 