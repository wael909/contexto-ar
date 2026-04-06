'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Copy, Play, Users } from 'lucide-react'
import { supabase, type Room, type Player } from '@/lib/supabase'

interface OnlineHostRoomProps {
  playerName: string
  roomCode: string
  roomId: string
  playerId: string
  onStartGame: () => void
  onBack: () => void
}

export function OnlineHostRoom({
  playerName,
  roomCode,
  roomId,
  playerId,
  onStartGame,
  onBack
}: OnlineHostRoomProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlayers()

    const channel = supabase
      .channel(`room:${roomId}`)
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

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  const loadPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setPlayers(data || [])
    } catch (error) {
      console.error('Error loading players:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleStartGame = async () => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({
          status: 'playing',
          started_at: new Date().toISOString()
        })
        .eq('id', roomId)

      if (error) throw error
      onStartGame()
    } catch (error) {
      console.error('Error starting game:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">غرفة اللعب</h2>
          <p className="text-muted-foreground">شارك الكود مع أصدقائك</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">كود الغرفة</p>
            <div className="text-5xl font-bold tracking-widest text-primary font-mono">
              {roomCode}
            </div>
          </div>

          <Button
            onClick={handleCopyCode}
            variant="outline"
            className="w-full gap-2"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'تم النسخ!' : 'نسخ الكود'}
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5" />
            <span>اللاعبون ({players.length})</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-md"
                >
                  <span className="font-medium">{player.name}</span>
                  {player.is_host && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      مضيف
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleStartGame}
            disabled={players.length < 1}
            className="w-full gap-2"
            size="lg"
          >
            <Play className="h-5 w-5" />
            بدء اللعب
          </Button>

          <Button
            onClick={onBack}
            variant="ghost"
            className="w-full"
          >
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  )
}
