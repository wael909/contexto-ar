# Multiplayer Setup Guide

## Overview

The application now includes both offline and online multiplayer modes:

- **Offline Mode**: Play the daily word challenge solo
- **Online Mode**: Play with friends in real-time with live leaderboards

## New Features

### 1. Landing Page
- Choose between Offline (solo) or Online (multiplayer) mode
- Professional Arabic dark theme maintained throughout

### 2. Online Mode Flow

#### Step 1: Name Input
- Players enter their display name (2-20 characters)
- Name will be visible to other players in the room

#### Step 2: Room Selection
- **Host Game**: Create a new room with a unique 4-digit code
- **Join Game**: Enter an existing room code to join friends

#### Step 3: Host Game Lobby
- Display the 4-digit room code for sharing
- Real-time player list showing who has joined
- Host can start the game when ready
- Maximum 10 players per room

#### Step 4: Online Gameplay
- All players see the same secret word
- Real-time leaderboard showing:
  - Player rankings based on best score
  - Number of guesses per player
  - Latest guess for each player
  - Winner status with trophy icon
- Individual guess history for each player
- Live updates when any player makes a guess

## Database Schema

The multiplayer system uses three main tables:

### Rooms Table
- `room_code`: 4-digit unique code for joining
- `target_word`: The secret word for this game
- `word_category`: Category hint
- `status`: waiting, playing, or finished
- `max_players`: Default 10 players

### Players Table
- `name`: Player display name
- `is_host`: Whether the player created the room
- `guesses_count`: Total number of guesses
- `best_score`: Best similarity score achieved
- `is_winner`: Whether they found the word

### Room Guesses Table
- `word`: The guessed word
- `score`: Similarity score (1-5000, lower is better)
- `rank`: Rank among that player's guesses

## Real-Time Features

Using Supabase Real-time subscriptions:

1. **Player List Updates**: When players join/leave
2. **Leaderboard Updates**: When any player makes a guess
3. **Winner Notifications**: When a player finds the word
4. **Activity Tracking**: Player last active timestamps

## Environment Variables Required

Create a `.env.local` file with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Hugging Face API Token (existing)
HUGGINGFACE_API_TOKEN=your_token
```

## Security Features

- Row Level Security (RLS) enabled on all tables
- Anonymous access allowed for gameplay (no authentication required)
- Players can only update their own data
- Room data is publicly readable for joining

## How to Play Online

1. **Host creates a room**:
   - Select "Online Mode"
   - Enter your name
   - Click "Host Game"
   - Share the 4-digit code with friends
   - Wait for players to join
   - Click "Start Game"

2. **Players join the room**:
   - Select "Online Mode"
   - Enter your name
   - Click "Join Game"
   - Enter the 4-digit code
   - Wait for host to start

3. **During gameplay**:
   - All players guess the same secret word
   - Leaderboard updates in real-time
   - Lower score = closer to the target word
   - First to score 1 wins!

## Responsive Design

- Mobile-optimized layouts
- Adaptive UI for PC and Mobile
- Touch-friendly controls
- Landscape and portrait support

## Cleanup

The database includes a cleanup function to remove old rooms after 24 hours:

```sql
SELECT cleanup_old_rooms();
```

You can set up a scheduled task (cron job) to run this periodically.
