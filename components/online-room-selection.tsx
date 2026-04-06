'use client'

import { Button } from '@/components/ui/button'
import { Crown, Users } from 'lucide-react'

interface OnlineRoomSelectionProps {
  playerName: string
  onHostGame: () => void
  onJoinGame: () => void
  onBack: () => void
}

export function OnlineRoomSelection({
  playerName,
  onHostGame,
  onJoinGame,
  onBack
}: OnlineRoomSelectionProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">مرحباً {playerName}!</h2>
          <p className="text-muted-foreground">اختر طريقة اللعب</p>
        </div>

        <div className="space-y-4 pt-4">
          <Button
            onClick={onHostGame}
            className="w-full h-20 text-lg flex items-center gap-4"
            size="lg"
          >
            <Crown className="h-6 w-6" />
            <div className="flex flex-col items-start">
              <span className="font-bold">إنشاء غرفة</span>
              <span className="text-sm opacity-90">قم باستضافة لعبة جديدة</span>
            </div>
          </Button>

          <Button
            onClick={onJoinGame}
            className="w-full h-20 text-lg flex items-center gap-4"
            variant="outline"
            size="lg"
          >
            <Users className="h-6 w-6" />
            <div className="flex flex-col items-start">
              <span className="font-bold">الانضمام لغرفة</span>
              <span className="text-sm opacity-90">ادخل كود الغرفة</span>
            </div>
          </Button>
        </div>

        <div className="pt-4">
          <Button
            onClick={onBack}
            variant="ghost"
            className="w-full"
          >
            رجوع
          </Button>
        </div>
      </div>
    </div>
  )
}
