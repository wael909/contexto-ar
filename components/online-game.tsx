'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import { Send, Trophy, Home } from 'lucide-react'
import { supabase, type Player, type RoomGuess } from '@/lib/supabase'
import { checkSimilarity } from '@/app/actions'
import { getScoreCategory, getScoreGradientClass } from '@/lib/types'
import { cn } from '@/lib/utils'

interface OnlineGameProps {
  roomId: string
  roomCode: string
  playerId: string
  playerName: string
  targetWord: string
  wordCategory: string
  onExit: () => void
}

interface LeaderboardPlayer extends Player {
  currentGuessWord?: string
}

export function OnlineGame({
  roomId,
  roomCode,
  playerId,
  playerName,
  targetWord,
  wordCategory,
  onExit
}: OnlineGameProps) {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([])
  const [myGuesses, setMyGuesses] = useState<RoomGuess[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isWinner, setIsWinner] = useState(false)

  useEffect(() => {
    loadPlayers()
    loadMyGuesses()

    const playersChannel = supabase
      .channel(`room-players:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadPlayers()
        }
      )
      .subscribe()

    const guessesChannel = supabase
      .channel(`room-guesses:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_guesses',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.new.player_id === playerId) {
            loadMyGuesses()
          }
          loadPlayers()
        }
      )
      .subscribe()

    const interval = setInterval(() => {
      updateActivity()
    }, 30000)

    return () => {
      supabase.removeChannel(playersChannel)
      supabase.removeChannel(guessesChannel)
      clearInterval(interval)
    }
  }, [roomId, playerId])

  const loadPlayers = async () => {
    try {
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('best_score', { ascending: true })

      if (playersError) throw playersError

      const { data: guessesData } = await supabase
        .from('room_guesses')
        .select('player_id, word, created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })

      const latestGuesses = new Map<string, string>()
      guessesData?.forEach(guess => {
        if (!latestGuesses.has(guess.player_id)) {
          latestGuesses.set(guess.player_id, guess.word)
        }
      })

      const enrichedPlayers = (playersData || []).map(player => ({
        ...player,
        currentGuessWord: latestGuesses.get(player.id)
      }))

      setPlayers(enrichedPlayers)
    } catch (error) {
      console.error('Error loading players:', error)
    }
  }

  const loadMyGuesses = async () => {
    try {
      const { data, error } = await supabase
        .from('room_guesses')
        .select('*')
        .eq('room_id', roomId)
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMyGuesses(data || [])

      const hasWon = data?.some(g => g.score === 1)
      if (hasWon) setIsWinner(true)
    } catch (error) {
      console.error('Error loading guesses:', error)
    }
  }

  const updateActivity = async () => {
    try {
      await supabase
        .from('players')
        .update({ last_active: new Date().toISOString() })
        .eq('id', playerId)
    } catch (error) {
      console.error('Error updating activity:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const word = input.trim()
    if (!word || isWinner) return

    if (myGuesses.some(g => g.word === word)) {
      setError('لقد خمنت هذه الكلمة من قبل')
      return
    }

    setError(null)

    startTransition(async () => {
      try {
        const result = await checkSimilarity(word, targetWord)

        if (result.error) {
          setError(result.error)
          return
        }

        const score = result.score ?? 5000
        const currentGuesses = myGuesses
        const rank = currentGuesses.filter(g => g.score > score).length + 1

        const { error: guessError } = await supabase
          .from('room_guesses')
          .insert({
            room_id: roomId,
            player_id: playerId,
            word,
            score,
            rank
          })

        if (guessError) throw guessError

        const newBestScore = Math.min(score, players.find(p => p.id === playerId)?.best_score || 5000)
        const newGuessesCount = (players.find(p => p.id === playerId)?.guesses_count || 0) + 1
        const won = score === 1

        await supabase
          .from('players')
          .update({
            best_score: newBestScore,
            guesses_count: newGuessesCount,
            is_winner: won,
            last_active: new Date().toISOString()
          })
          .eq('id', playerId)

        setInput('')
        if (won) {
          setIsWinner(true)
        }
      } catch (err) {
        setError('حدث خطأ أثناء التحقق من الكلمة')
        console.error('Error:', err)
      }
    })
  }

  const myPlayer = players.find(p => p.id === playerId)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary">كونتكستو عربي</h1>
            <p className="text-sm text-muted-foreground">الغرفة: {roomCode}</p>
          </div>
          <Button onClick={onExit} variant="ghost" size="icon">
            <Home className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col lg:flex-row gap-4 max-w-7xl mx-auto w-full">
        <div className="lg:w-1/3 flex flex-col gap-4 order-1 lg:order-1">
          <div className="bg-card rounded-lg border border-border p-4">
            <h2 className="text-lg font-semibold mb-4 text-center">لوحة المتصدرين</h2>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className={cn(
                      'p-3 rounded-lg border transition-all',
                      player.id === playerId ? 'bg-primary/10 border-primary' : 'bg-secondary border-border',
                      player.is_winner && 'ring-2 ring-primary'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-muted text-muted-foreground'
                        )}>
                          {index + 1}
                        </span>
                        <span className="font-semibold">{player.name}</span>
                        {player.is_winner && (
                          <Trophy className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-primary">{player.best_score}</div>
                        <div className="text-xs text-muted-foreground">{player.guesses_count} محاولة</div>
                      </div>
                    </div>
                    {player.currentGuessWord && (
                      <div className="text-xs text-muted-foreground truncate">
                        آخر تخمين: {player.currentGuessWord}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold mb-2">إحصائياتي</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">المحاولات:</span>
                <span className="font-bold mr-2">{myPlayer?.guesses_count || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">أفضل نتيجة:</span>
                <span className="font-bold mr-2">{myPlayer?.best_score || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:w-2/3 flex flex-col order-2 lg:order-2 min-h-[300px] lg:min-h-0">
          <div className="bg-card rounded-lg border border-border p-4 flex-1 flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2 text-center">تخميناتي</h2>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="اكتب تخمينك هنا..."
                  className="flex-1 text-right"
                  disabled={isPending || isWinner}
                  dir="rtl"
                />
                <Button
                  type="submit"
                  disabled={isPending || !input.trim() || isWinner}
                >
                  {isPending ? (
                    <Spinner className="h-5 w-5" />
                  ) : (
                    <Send className="h-5 w-5 rotate-180" />
                  )}
                </Button>
              </form>
              {error && (
                <p className="text-destructive text-sm mt-2">{error}</p>
              )}
              {isWinner && (
                <p className="text-primary text-center font-bold text-lg mt-2">
                  مبروك! لقد وجدت الكلمة الصحيحة!
                </p>
              )}
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-2 p-1">
                {myGuesses.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground py-8">
                    <p>ابدأ بتخمين كلمة</p>
                  </div>
                ) : (
                  myGuesses.map((guess, index) => {
                    const category = getScoreCategory(guess.score)
                    const gradientClass = getScoreGradientClass(category)
                    const isWin = guess.score === 1

                    return (
                      <div
                        key={guess.id}
                        className={cn(
                          'flex items-center justify-between rounded-lg px-4 py-3',
                          gradientClass,
                          isWin && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                            isWin ? 'bg-background/30 text-foreground' : 'bg-background/20 text-foreground'
                          )}>
                            {myGuesses.length - index}
                          </span>
                          <span className="font-semibold text-lg text-foreground">
                            {guess.word}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-foreground">
                          <span className="text-2xl font-bold">{guess.score}</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </main>
    </div>
  )
}
