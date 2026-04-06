import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export interface Room {
  id: string
  room_code: string
  host_player_id: string
  target_word: string
  word_category: string
  date_string: string
  status: 'waiting' | 'playing' | 'finished'
  created_at: string
  started_at: string | null
  max_players: number
}

export interface Player {
  id: string
  room_id: string
  name: string
  is_host: boolean
  guesses_count: number
  best_score: number
  is_winner: boolean
  created_at: string
  last_active: string
}

export interface RoomGuess {
  id: string
  room_id: string
  player_id: string
  word: string
  score: number
  rank: number
  created_at: string
}
