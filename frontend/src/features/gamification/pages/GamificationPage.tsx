import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Coins,
  Shield,
  CheckCircle,
  Lock,
  Compass,
  Star,
  Award,
  Sparkles,
  Flame,
  Volume2,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

// Dummy Data
interface Quest {
  id: string
  title: string
  rewardXp: number
  rewardCoins: number
  completed: boolean
  claimed: boolean
}

interface Achievement {
  id: string
  title: string
  description: string
  unlocked: boolean
  icon: string
}

interface ShopItem {
  id: string
  title: string
  cost: number
  description: string
  unlocked: boolean
}

const initialQuests: Quest[] = [
  { id: 'q1', title: 'Complete 1 Pomodoro session', rewardXp: 100, rewardCoins: 20, completed: true, claimed: false },
  { id: 'q2', title: 'Check off 3 high priority tasks', rewardXp: 150, rewardCoins: 30, completed: false, claimed: false },
  { id: 'q3', title: 'Maintain a 7-day habit streak', rewardXp: 200, rewardCoins: 50, completed: true, claimed: false },
]

const initialAchievements: Achievement[] = [
  { id: 'a1', title: 'Focus King', description: 'Complete 10 Pomodoro sessions in a week.', unlocked: true, icon: '👑' },
  { id: 'a2', title: 'Deadline Hero', description: 'Complete an urgent task before it defaults.', unlocked: true, icon: '⚡' },
  { id: 'a3', title: 'Consistency Pro', description: 'Log a 30-day streak on daily coding.', unlocked: false, icon: '🔥' },
]

const initialShopItems: ShopItem[] = [
  { id: 's1', title: 'Lo-Fi Focus Beats Pack', cost: 100, description: 'Unlock premium relaxing music tracks.', unlocked: false },
  { id: 's2', title: 'Retro Terminal Theme', cost: 200, description: 'Unlock a nostalgic green-phosphor CLI UI layout.', unlocked: false },
  { id: 's3', title: 'Priority AI Co-Pilot', cost: 400, description: 'Upgrade your AI coach with custom voice prompts.', unlocked: false },
]

export const GamificationPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast)

  // Gamification Metrics
  const [level, setLevel] = useState(14)
  const [xp, setXp] = useState(1850)
  const maxXp = 2000
  const [coins, setCoins] = useState(450)

  // Interactive Quests & Shop state
  const [quests, setQuests] = useState<Quest[]>(initialQuests)
  const [shopItems, setShopItems] = useState<ShopItem[]>(initialShopItems)

  // Level Up modal & Confetti Trigger
  const [levelUpOpen, setLevelUpOpen] = useState(false)
  const [confettiActive, setConfettiActive] = useState(false)

  const triggerLevelUp = () => {
    setLevelUpOpen(true)
    setConfettiActive(true)
    // Deactivate confetti after some seconds
    setTimeout(() => setConfettiActive(false), 5000)
  }

  const handleClaimReward = (questId: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === questId) {
          const newXp = xp + q.rewardXp
          setCoins((c) => c + q.rewardCoins)

          addToast({
            type: 'success',
            title: 'Reward Claimed!',
            message: `+${q.rewardXp} XP and +${q.rewardCoins} Coins added.`,
          })

          // Check if user leveled up
          if (newXp >= maxXp) {
            setXp(newXp - maxXp)
            setLevel((l) => l + 1)
            setTimeout(() => triggerLevelUp(), 400)
          } else {
            setXp(newXp)
          }

          return { ...q, claimed: true }
        }
        return q
      }),
    )
  }

  const handlePurchaseItem = (item: ShopItem) => {
    if (coins < item.cost) {
      addToast({
        type: 'warning',
        title: 'Insufficient Coins',
        message: `You need ${item.cost - coins} more coins to purchase this.`,
      })
      return
    }

    setCoins((c) => c - item.cost)
    setShopItems((prev) => prev.map((s) => (s.id === item.id ? { ...s, unlocked: true } : s)))

    addToast({
      type: 'success',
      title: 'Item Unlocked!',
      message: `"${item.title}" successfully purchased and added to settings.`,
    })
  }

  // Simulated Confetti Particles
  const renderConfetti = () => {
    return (
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {Array.from({ length: 45 }).map((_, i) => {
          const xStart = Math.random() * 100 // percentage
          const duration = Math.random() * 2 + 1.5 // seconds
          const delay = Math.random() * 1.5
          const size = Math.random() * 8 + 6 // px
          const colors = ['bg-amber-400', 'bg-red-400', 'bg-blue-400', 'bg-emerald-400', 'bg-indigo-400']
          const randomColor = colors[Math.floor(Math.random() * colors.length)]

          return (
            <motion.div
              key={i}
              initial={{ y: -20, x: `${xStart}%`, rotate: 0, opacity: 1 }}
              animate={{
                y: '100vh',
                x: `${xStart + (Math.random() * 20 - 10)}%`,
                rotate: 360,
                opacity: 0,
              }}
              transition={{
                duration,
                delay,
                ease: 'linear',
                repeat: 0,
              }}
              className={cn('absolute rounded-sm shadow-sm', randomColor)}
              style={{ width: size, height: size }}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      {/* Dynamic Confetti Shower */}
      {confettiActive && renderConfetti()}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-foreground flex items-center gap-2.5">
            <Trophy className="h-7 w-7 text-primary" />
            Gamification Engine
          </h1>
          <p className="text-sm text-muted-foreground">Complete challenges, earn coins, and unlock customizations.</p>
        </div>
      </div>

      {/* 1. Status Dashboard row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Level & XP progression */}
        <Card className="md:col-span-2 relative overflow-hidden bg-primary/5 border-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progression Meter</span>
            <Shield className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="font-display font-black text-3xl">Level {level}</span>
              <span className="text-xs font-bold text-muted-foreground">{xp} / {maxXp} XP</span>
            </div>
            <Progress value={(xp / maxXp) * 100} className="h-3" color="bg-primary" />
          </CardContent>
        </Card>

        {/* Currency balance */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vault Balance</span>
            <Coins className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-3xl">{coins}</span>
              <span className="text-xs font-bold text-amber-500">Coins</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Complete challenges to earn more.</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Main Page Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quests & Rewards Shop */}
        <div className="lg:col-span-2 space-y-6">
          {/* Challenges List */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" /> Today's Quests & Challenges
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {quests.map((quest) => (
                <div
                  key={quest.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/5"
                >
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-foreground">{quest.title}</h5>
                    <div className="flex gap-2">
                      <span className="text-[10px] text-primary font-bold">+{quest.rewardXp} XP</span>
                      <span className="text-[10px] text-amber-500 font-bold">+{quest.rewardCoins} Coins</span>
                    </div>
                  </div>

                  {quest.claimed ? (
                    <Badge variant="outline" className="text-xs">Claimed</Badge>
                  ) : quest.completed ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleClaimReward(quest.id)}
                      className="h-8 text-[10px] px-3 font-semibold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 border-none"
                    >
                      Claim
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="text-xs">In Progress</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Rewards Shop */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-500" /> Unlockable Customizations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {shopItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/5"
                >
                  <div className="space-y-1 text-left">
                    <h5 className="text-xs font-bold text-foreground">{item.title}</h5>
                    <p className="text-[10px] text-muted-foreground">{item.description}</p>
                    <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                      Cost: {item.cost} Coins
                    </span>
                  </div>

                  {item.unlocked ? (
                    <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500/20 bg-emerald-500/5">
                      Unlocked
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePurchaseItem(item)}
                      className="h-8 text-[10px] px-3 font-semibold"
                    >
                      Buy
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Achievements & Badges shelf */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" /> Achievements Shelf
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-4">
              {initialAchievements.map((ach) => (
                <div
                  key={ach.id}
                  className={cn(
                    'p-3 rounded-xl border flex items-center gap-3',
                    ach.unlocked ? 'bg-secondary/15 border-border' : 'bg-secondary/5 border-border/40 opacity-55'
                  )}
                >
                  <span className="text-2xl">{ach.icon}</span>
                  <div className="space-y-1 text-left flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      {ach.title}
                      {!ach.unlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </h5>
                    <p className="text-[10px] text-muted-foreground leading-normal break-words">
                      {ach.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Level Up Celebration Dialog Modal */}
      <AnimatePresence>
        {levelUpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLevelUpOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-sm rounded-2xl border border-primary/20 bg-card p-8 text-center shadow-2xl backdrop-blur-lg z-10 flex flex-col items-center gap-4"
            >
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-black">
                  L
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-amber-400 animate-bounce" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Level Up Celebration</span>
                <h2 className="font-display font-black text-2xl text-foreground">Level {level} Reached!</h2>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  Excellent work! Your cognitive stamina is breaking records. You've earned bonus vault tokens.
                </p>
              </div>

              <Button
                variant="primary"
                onClick={() => setLevelUpOpen(false)}
                className="w-full mt-4"
              >
                Claim Level Up Rewards
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GamificationPage
