-- WBDoc Baseball — 2026 attendee roster
--
-- Seeds the 15 attendees confirmed for baseball this year: the 13 hard
-- confirmations plus Ashley and Lekfo, who are still tentative. Riya, Sohil,
-- and Will V. are deliberately excluded — they have not confirmed.
--
-- Staying in the house: Anuj, Sankash, Jesse, Rob, Sam, Leanne, Dom, Francis
-- (8 confirmed), plus Ashley and Lekfo if they come (10).
--
-- Safe to re-run: existing players are matched case-insensitively by name and
-- reactivated rather than duplicated. Run it in the Supabase SQL editor, or:
--   psql "$DATABASE_URL" -f scripts/seed-2026-attendees.sql

begin;

create temporary table attendees_2026 (name text primary key) on commit drop;

insert into attendees_2026 (name) values
	('Anuj'),
	('Sankash'),
	('Jesse'),
	('Rob'),
	('Sam'),
	('Hannah'),
	('Brian'),
	('Natalie'),
	('Jacob'),
	('Leanne'),
	('Dom'),
	('Ashley'),
	('Lekfo'),
	('Francis'),
	('Kat');

-- Reactivate anyone already on file who was marked inactive in a prior year.
update players p
set is_active = true,
	updated_at = now()
from attendees_2026 a
where lower(p.name) = lower(a.name)
	and p.is_active is distinct from true;

-- Add anyone not already on file.
insert into players (name, is_active, championships_won)
select a.name, true, 0
from attendees_2026 a
where not exists (
	select 1 from players p where lower(p.name) = lower(a.name)
);

commit;

-- Verify: expect 15 rows.
select p.name, p.is_active, p.championships_won
from players p
where lower(p.name) in (
	'anuj', 'sankash', 'jesse', 'rob', 'sam', 'hannah', 'brian', 'natalie',
	'jacob', 'leanne', 'dom', 'ashley', 'lekfo', 'francis', 'kat'
)
order by p.name;
