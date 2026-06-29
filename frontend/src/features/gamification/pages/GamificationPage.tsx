import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Coins,
  Shield,
  Lock,
  Compass,
  Award,
  Sparkles,
  Flame,
  User,
  Users,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { useToastStore } from '@/store/useToastStore'
import { useGamificationStore } from '@/store/useGamificationStore'
import { cn } from '@/utils/cn'

export const GamificationPage: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast)

  const {
    profile,
    achievements,
    challenges,
    leaderboard,
    isLoading,
    fetchProfile,
    fetchAchievements,
    fetchChallenges,
    fetchLeaderboard
  } = useGamificationStore()

  // Level Up modal & Confetti Trigger
  const [levelUpOpen, setLevelUpOpen] = useState(false)
  const [confettiActive, setConfettiActive] = useState(false)
  const [lastSeenLevel, setLastSeenLevel] = useState<number | null>(null)

  useEffect(() => {
    fetchProfile()
    fetchAchievements()
    fetchChallenges()
    fetchLeaderboard()
  }, [fetchProfile, fetchAchievements, fetchChallenges, fetchLeaderboard])

  // Watch for Level Ups
  useEffect(() => {
    if (profile) {
      if (lastSeenLevel !== null && profile.level > lastSeenLevel) {
        setLevelUpOpen(true)
        setConfettiActive(true)
        setTimeout(() => setConfettiActive(false), 5000)
      }
      setLastSeenLevel(profile.level)
    }
  }, [profile, lastSeenLevel])

  // Formula for XP target to reach next level: (level * 10)^2
  const getXpThresholds = () => {
    if (!profile) return { minXp: 0, maxXp: 100 }
    const currentLevel = profile.level
    const minXp = currentLevel === 1 ? 0 : Math.pow((currentLevel - 1) * 10, 2)
    const maxXp = Math.pow(currentLevel * 10, 2)
    return { minXp, maxXp }
  }

  const { minXp, maxXp } = getXpThresholds()
  const relativeXp = profile ? profile.xp - minXp : 0
  const relativeMaxXp = maxXp - minXp

  // Simulated Confetti Particles
  const renderConfetti = () => {
    return (
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {Array.from({ length: 45 }).map((_, i) => {
          const xStart = Math.random() * 100
          const duration = Math.random() * 2 + 1.5
          const delay = Math.random() * 1.5
          const size = Math.random() * 8 + 6
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
      {confettiActive && renderConfetti()}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-foreground flex items-center gap-2.5">
            <Trophy className="h-7 w-7 text-primary" />
            Gamification Engine
          </h1>
          <p className="text-sm text-muted-foreground">Complete challenges, earn coins, and rank up on the leaderboard.</p>
        </div>
      </div>

      {/* 1. Status Dashboard Row */}
      {profile ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2 relative overflow-hidden bg-primary/5 border-primary/20 text-left">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progression Meter</span>
              <Shield className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="font-display font-black text-3xl">Level {profile.level}</span>
                <span className="text-xs font-bold text-muted-foreground">
                  {profile.xp} / {maxXp} XP
                </span>
              </div>
              <Progress value={(relativeXp / relativeMaxXp) * 100} className="h-3" color="bg-primary" />
            </CardContent>
          </Card>

          <Card className="text-left">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vault Balance & Streak</span>
              <Coins className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-display font-black text-3xl">{profile.coins}</span>
                  <span className="text-xs font-bold text-amber-500 ml-1">Coins</span>
                </div>
                <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full">
                  <Flame className="h-4 w-4 fill-current" />
                  <span className="text-xs font-black">{profile.streak_days} Days</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">Complete tasks and build habits to earn reward items.</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="py-10 text-center text-xs text-muted-foreground">Loading profile...</div>
      )}

      {/* 2. Main Page Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Challenges & Achievements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Challenges List */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/40 bg-secondary/5">
              <CardTitle className="text-sm flex items-center gap-2 text-left">
                <Compass className="h-4 w-4 text-primary" /> Active Missions & Challenges
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">Loading missions...</div>
              ) : challenges.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center">No active missions available.</p>
              ) : (
                challenges.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-secondary/5 gap-4"
                  >
                    <div className="space-y-1 text-left flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="text-xs font-bold text-foreground">{ch.title}</h5>
                        <Badge variant="secondary" className="text-[9px] font-black uppercase">
                          {ch.type}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{ch.description}</p>
                      
                      {/* Challenge progress bar */}
                      <div className="flex items-center gap-3 pt-1">
                        <Progress value={(ch.current_value / ch.target_value) * 100} className="h-2 flex-grow max-w-[200px]" color="bg-emerald-500" />
                        <span className="text-[9px] font-bold text-muted-foreground shrink-0">{ch.current_value} / {ch.target_value}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] text-primary font-bold">+{ch.xp_reward} XP</span>
                        <span className="text-[9px] text-amber-500 font-bold">+{ch.coins_reward} Coins</span>
                      </div>
                      {ch.is_completed ? (
                        <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500 text-xs px-2.5 py-0.5">
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Achievements shelf */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/40 bg-secondary/5">
              <CardTitle className="text-sm flex items-center gap-2 text-left">
                <Award className="h-4 w-4 text-amber-500" /> Achievements Shelf
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center col-span-2">No achievements loaded.</p>
              ) : (
                achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={cn(
                      'p-3 rounded-xl border flex items-center gap-3 transition-all',
                      ach.is_unlocked
                        ? 'bg-secondary/10 border-border'
                        : 'bg-secondary/5 border-border/40 opacity-55'
                    )}
                  >
                    <span className="text-2xl shrink-0">
                      {ach.is_unlocked ? '🏆' : '🔒'}
                    </span>
                    <div className="space-y-1 text-left flex-grow min-w-0">
                      <h5 className="text-xs font-bold text-foreground truncate flex items-center gap-1.5">
                        {ach.title}
                      </h5>
                      <p className="text-[9px] text-muted-foreground leading-normal line-clamp-2">
                        {ach.description}
                      </p>
                      <div className="flex gap-2 text-[8px] font-bold">
                        <span className="text-primary">+{ach.xp_reward} XP</span>
                        <span className="text-amber-500">+{ach.coins_reward} Coins</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Leaderboard stand */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-border/40 bg-secondary/5">
              <CardTitle className="text-sm flex items-center gap-2 text-left">
                <Users className="h-4 w-4 text-primary" /> Global Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 divide-y divide-border/60">
              {leaderboard.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Leaderboard is empty.</p>
              ) : (
                leaderboard.map((user) => {
                  const isCurrentUser = profile && user.email === profile.email

                  return (
                    <div
                      key={user.email}
                      className={cn(
                        'py-2.5 flex items-center justify-between gap-3 text-left',
                        isCurrentUser && 'bg-primary/5 rounded-lg px-2 -mx-2 border border-primary/10'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={cn(
                          'w-5 text-center text-xs font-black shrink-0',
                          user.rank === 1 ? 'text-amber-500' : user.rank === 2 ? 'text-slate-400' : user.rank === 3 ? 'text-amber-700' : 'text-muted-foreground'
                        )}>
                          #{user.rank}
                        </span>
                        <div className="min-w-0">
                          <h6 className="text-xs font-bold text-foreground truncate">
                            {user.username}
                          </h6>
                          <span className="text-[9px] text-muted-foreground block">
                            Level {user.level}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-black text-foreground">
                          {user.xp} <span className="text-[9px] font-normal text-muted-foreground">XP</span>
                        </span>
                        {user.streak_days > 0 && (
                          <div className="flex items-center gap-0.5 text-orange-500 text-[9px] font-black">
                            <Flame className="h-3 w-3 fill-current" />
                            {user.streak_days}d
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
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
                  {profile?.level}
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-6 w-6 text-amber-400 animate-bounce" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Level Up Celebration</span>
                <h2 className="font-display font-black text-2xl text-foreground">Level {profile?.level} Reached!</h2>
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
