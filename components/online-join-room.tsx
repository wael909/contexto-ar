'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LogIn } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

interface OnlineJoinRoomProps {
  playerName: string
  onJoinRoom: (roomCode: string) => Promise<void>
  onBack: () => void
}

export function OnlineJoinRoom({
  playerName,
  onJoinRoom,
  onBack
}: OnlineJoinRoomProps) {
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedCode = roomCode.trim().toUpperCase()
    if (!trimmedCode) {
      setError('الرجاء إدخال كود الغرفة')
      return
    }

    if (trimmedCode.length !== 4) {
      setError('الكود يجب أن يكون 4 أرقام')
      return
    }

    if (!/^\d{4}$/.test(trimmedCode)) {
      setError('الكود يجب أن يحتوي على أرقام فقط')
      return
    }

    setError('')
    setLoading(true)

    try {
      await onJoinRoom(trimmedCode)
    } catch (err: any) {
      setError(err.message || 'فشل الانضمام للغرفة')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
    setRoomCode(value)
    setError('')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <LogIn className="h-16 w-16 text-primary" />
          </div>
          <h2 className="text-3xl font-bold">الانضمام لغرفة</h2>
          <p className="text-muted-foreground">أدخل كود الغرفة المكون من 4 أرقام</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              value={roomCode}
              onChange={handleInputChange}
              placeholder="0000"
              className="text-4xl h-20 text-center tracking-widest font-mono font-bold"
              maxLength={4}
              autoFocus
              disabled={loading}
            />
            {error && (
              <p className="text-destructive text-sm mt-2 text-center">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              رجوع
            </Button>
            <Button
              type="submit"
              disabled={roomCode.length !== 4 || loading}
              className="flex-1 gap-2"
            >
              {loading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  جاري الانضمام...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  انضم
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
