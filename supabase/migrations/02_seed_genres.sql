-- Seed default genres for Music City Odia catalog
insert into public.genres (name) values
  ('Odia Pop'),
  ('Sambalpuri Folk'),
  ('Bhajan'),
  ('Romantic'),
  ('Film Soundtrack')
on conflict (name) do nothing;
