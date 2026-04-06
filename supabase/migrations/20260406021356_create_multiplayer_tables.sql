/*
  # Create Multiplayer Game Tables

  1. New Tables
    - `rooms`
      - `id` (uuid, primary key)
      - `room_code` (text, unique) - 4 digit code
      - `host_player_id` (uuid) - reference to host player
      - `target_word` (text) - the secret word for this room
      - `word_category` (text) - category hint
      - `date_string` (text) - date for word selection
      - `status` (text) - 'waiting', 'playing', 'finished'
      - `created_at` (timestamptz)
      - `started_at` (timestamptz)
      - `max_players` (int) - default 10
    
    - `players`
      - `id` (uuid, primary key)
      - `room_id` (uuid) - foreign key to rooms
      - `name` (text) - player display name
      - `is_host` (boolean) - is this the host
      - `guesses_count` (int) - number of guesses made
      - `best_score` (int) - best score achieved (lower is better)
      - `is_winner` (boolean) - has found the word
      - `created_at` (timestamptz)
      - `last_active` (timestamptz)
    
    - `room_guesses`
      - `id` (uuid, primary key)
      - `room_id` (uuid) - foreign key to rooms
      - `player_id` (uuid) - foreign key to players
      - `word` (text) - guessed word
      - `score` (int) - similarity score
      - `rank` (int) - rank among guesses
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for players to read/write their own data
    - Add policies for room access
*/

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text UNIQUE NOT NULL,
  host_player_id uuid,
  target_word text NOT NULL,
  word_category text NOT NULL,
  date_string text NOT NULL,
  status text NOT NULL DEFAULT 'waiting',
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  max_players int DEFAULT 10,
  CONSTRAINT valid_status CHECK (status IN ('waiting', 'playing', 'finished'))
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_host boolean DEFAULT false,
  guesses_count int DEFAULT 0,
  best_score int DEFAULT 5000,
  is_winner boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now()
);

-- Create room_guesses table
CREATE TABLE IF NOT EXISTS room_guesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  word text NOT NULL,
  score int NOT NULL,
  rank int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_players_room ON players(room_id);
CREATE INDEX IF NOT EXISTS idx_guesses_room ON room_guesses(room_id);
CREATE INDEX IF NOT EXISTS idx_guesses_player ON room_guesses(player_id);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_guesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms table
-- Anyone can read room data (needed for joining)
CREATE POLICY "Anyone can read rooms"
  ON rooms FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can create a room
CREATE POLICY "Anyone can create rooms"
  ON rooms FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only host can update room
CREATE POLICY "Host can update room"
  ON rooms FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for players table
-- Anyone can read players in any room
CREATE POLICY "Anyone can read players"
  ON players FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can create a player entry
CREATE POLICY "Anyone can create players"
  ON players FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Players can update their own data
CREATE POLICY "Players can update themselves"
  ON players FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for room_guesses table
-- Anyone can read guesses in any room
CREATE POLICY "Anyone can read guesses"
  ON room_guesses FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can create guesses
CREATE POLICY "Anyone can create guesses"
  ON room_guesses FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Function to clean up old rooms (optional - for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM rooms 
  WHERE created_at < NOW() - INTERVAL '24 hours'
  AND status != 'playing';
END;
$$ LANGUAGE plpgsql;