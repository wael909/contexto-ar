'use client'

import { useState } from 'react'
import { LandingPage } from './landing-page'
import { OnlineNameInput } from './online-name-input'
import { OnlineRoomSelection } from './online-room-selection'
import { OnlineHostRoom } from './online-host-room'
import { OnlineJoinRoom } from './online-join-room'
import { OnlineGame } from './online-game'
import { GameContainer } from './game-container'
import { supabase } from '@/lib/supabase'
import { getWordForDate, getTodayDateString } from '@/lib/words'

type AppState =
  | { screen: 'landing' }
  | { screen: 'offline-game' }
  | { screen: 'online-name' }
  | { screen: 'online-room-selection'; playerName: string }
  | { screen: 'online-host-room'; playerName: string; roomCode: string; roomId: string; playerId: string }
  | { screen: 'online-join-room'; playerName: string }
  | { screen: 'online-game'; playerName: string; roomId: string; roomCode: string; playerId: string; targetWord: string; wordCategory: string }

export function AppContainer() {
  const [state, setState] = useState<AppState>({ screen: 'landing' })

  const handleSelectMode = (mode: 'offline' | 'online') => {
    if (mode === 'offline') {
      setState({ screen: 'offline-game' })
    } else {
      setState({ screen: 'online-name' })
    }
  }

  const handleNameSubmit = (name: string) => {
    setState({ screen: 'online-room-selection', playerName: name })
  }

  const handleHostGame = async () => {
    if (state.screen !== 'online-room-selection') return

    try {
      const roomCode = Math.floor(1000 + Math.random() * 9000).toString()
      const dateString = getTodayDateString()
      const wordData = getWordForDate(dateString)

      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          room_code: roomCode,
          target_word: wordData.word,
          word_category: wordData.category,
          date_string: dateString,
          status: 'waiting'
        })
        .select()
        .single()

      if (roomError) throw roomError

      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: roomData.id,
          name: state.playerName,
          is_host: true
        })
        .select()
        .single()

      if (playerError) throw playerError

      await supabase
        .from('rooms')
        .update({ host_player_id: playerData.id })
        .eq('id', roomData.id)

      setState({
        screen: 'online-host-room',
        playerName: state.playerName,
        roomCode,
        roomId: roomData.id,
        playerId: playerData.id
      })
    } catch (error) {
      console.error('Error creating room:', error)
      alert('فشل إنشاء الغرفة، حاول مرة أخرى')
    }
  }

  const handleJoinGameScreen = () => {
    if (state.screen !== 'online-room-selection') return
    setState({ screen: 'online-join-room', playerName: state.playerName })
  }

  const handleJoinRoom = async (roomCode: string) => {
    if (state.screen !== 'online-join-room') return

    try {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .maybeSingle()

      if (roomError) throw roomError
      if (!roomData) {
        throw new Error('الغرفة غير موجودة')
      }

      if (roomData.status === 'finished') {
        throw new Error('هذه الغرفة انتهت')
      }

      const { count } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomData.id)

      if (count && count >= roomData.max_players) {
        throw new Error('الغرفة ممتلئة')
      }

      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: roomData.id,
          name: state.playerName,
          is_host: false
        })
        .select()
        .single()

      if (playerError) throw playerError

      if (roomData.status === 'playing') {
        setState({
          screen: 'online-game',
          playerName: state.playerName,
          roomId: roomData.id,
          roomCode: roomData.room_code,
          playerId: playerData.id,
          targetWord: roomData.target_word,
          wordCategory: roomData.word_category
        })
      } else {
        setState({
          screen: 'online-host-room',
          playerName: state.playerName,
          roomCode: roomData.room_code,
          roomId: roomData.id,
          playerId: playerData.id
        })
      }
    } catch (error: any) {
      throw error
    }
  }

  const handleStartGame = () => {
    if (state.screen !== 'online-host-room') return

    supabase
      .from('rooms')
      .select('target_word, word_category')
      .eq('id', state.roomId)
      .single()
      .then(({ data }) => {
        if (data) {
          setState({
            screen: 'online-game',
            playerName: state.playerName,
            roomId: state.roomId,
            roomCode: state.roomCode,
            playerId: state.playerId,
            targetWord: data.target_word,
            wordCategory: data.word_category
          })
        }
      })
  }

  const handleBackToLanding = () => {
    setState({ screen: 'landing' })
  }

  const handleBackToRoomSelection = () => {
    if (state.screen === 'online-host-room' || state.screen === 'online-join-room') {
      const playerName = state.playerName
      setState({ screen: 'online-room-selection', playerName })
    }
  }

  const handleBackToName = () => {
    setState({ screen: 'online-name' })
  }

  switch (state.screen) {
    case 'landing':
      return <LandingPage onSelectMode={handleSelectMode} />

    case 'offline-game':
      return <GameContainer />

    case 'online-name':
      return (
        <OnlineNameInput
          onNameSubmit={handleNameSubmit}
          onBack={handleBackToLanding}
        />
      )

    case 'online-room-selection':
      return (
        <OnlineRoomSelection
          playerName={state.playerName}
          onHostGame={handleHostGame}
          onJoinGame={handleJoinGameScreen}
          onBack={handleBackToName}
        />
      )

    case 'online-host-room':
      return (
        <OnlineHostRoom
          playerName={state.playerName}
          roomCode={state.roomCode}
          roomId={state.roomId}
          playerId={state.playerId}
          onStartGame={handleStartGame}
          onBack={handleBackToRoomSelection}
        />
      )

    case 'online-join-room':
      return (
        <OnlineJoinRoom
          playerName={state.playerName}
          onJoinRoom={handleJoinRoom}
          onBack={handleBackToRoomSelection}
        />
      )

    case 'online-game':
      return (
        <OnlineGame
          roomId={state.roomId}
          roomCode={state.roomCode}
          playerId={state.playerId}
          playerName={state.playerName}
          targetWord={state.targetWord}
          wordCategory={state.wordCategory}
          onExit={handleBackToLanding}
        />
      )

    default:
      return <LandingPage onSelectMode={handleSelectMode} />
  }
}
