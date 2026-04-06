'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Gamepad2, Wifi, WifiOff } from 'lucide-react'

interface LandingPageProps {
  onSelectMode: (mode: 'offline' | 'online') => void
}

export function LandingPage({ onSelectMode }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Gamepad2 className="h-20 w-20 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-primary">كونتكستو عربي</h1>
          <p className="text-muted-foreground text-lg">لعبة تخمين الكلمات العربية</p>
        </div>

        <div className="space-y-4 pt-8">
          <Button
            onClick={() => onSelectMode('offline')}
            className="w-full h-20 text-lg flex items-center gap-4"
            size="lg"
          >
            <WifiOff className="h-6 w-6" />
            <div className="flex flex-col items-start">
              <span className="font-bold">لعب منفرد</span>
              <span className="text-sm opacity-90">تحدي اليوم</span>
            </div>
          </Button>

          <Button
            onClick={() => onSelectMode('online')}
            className="w-full h-20 text-lg flex items-center gap-4"
            variant="outline"
            size="lg"
          >
            <Wifi className="h-6 w-6" />
            <div className="flex flex-col items-start">
              <span className="font-bold">لعب جماعي</span>
              <span className="text-sm opacity-90">تحدى أصدقائك</span>
            </div>
          </Button>
        </div>

        <div className="pt-8 text-center text-sm text-muted-foreground">
          <p>اكتشف الكلمة السرية باستخدام التشابه الدلالي</p>
        </div>
      </div>
    </div>
  )
}
