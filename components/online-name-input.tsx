'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, User } from 'lucide-react'

interface OnlineNameInputProps {
  onNameSubmit: (name: string) => void
  onBack: () => void
}

export function OnlineNameInput({ onNameSubmit, onBack }: OnlineNameInputProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('الرجاء إدخال اسمك')
      return
    }

    if (trimmedName.length < 2) {
      setError('الاسم يجب أن يكون حرفين على الأقل')
      return
    }

    if (trimmedName.length > 20) {
      setError('الاسم طويل جداً')
      return
    }

    onNameSubmit(trimmedName)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <User className="h-16 w-16 text-primary" />
          </div>
          <h2 className="text-3xl font-bold">ما اسمك؟</h2>
          <p className="text-muted-foreground">سيظهر اسمك للاعبين الآخرين</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              placeholder="أدخل اسمك"
              className="text-lg h-12 text-center"
              maxLength={20}
              autoFocus
              dir="rtl"
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
            >
              رجوع
            </Button>
            <Button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 gap-2"
            >
              التالي
              <ArrowRight className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
