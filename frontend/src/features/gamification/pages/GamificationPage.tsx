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
import { useAppStore } from '@/store/useAppStore'
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
        // Trigger a beautiful canvas-confetti blast on level-up!
        import('canvas-confetti').then((confettiModule) => {
          const confettiFn = confettiModule.default || confettiModule
          confettiFn({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#fbbf24', '#f59e0b', '#10b981']
          })
        }).catch(() => {})
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
        <div>
          <h1 className="font-display font-black text-3xl tracking-tight text-foreground flex items-center gap-2.5">
            <Trophy className="h-7 w-7 text-amber-500 animate-bounce" />
            Gamification Engine
          </h1>
          <p className="text-sm text-muted-foreground">Complete challenges, earn coins, and rank up on the leaderboard.</p>
        </div>
      </div>

      {/* 1. Status Dashboard Row */}
      {profile ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2 relative overflow-hidden bg-primary/5 border-primary/20 text-left shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Progression Meter</span>
              <Shield className="h-5 w-5 text-primary animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="font-display font-black text-3xl">Level {profile.level}</span>
                <span className="text-xs font-black text-muted-foreground">
                  {profile.xp} / {maxXp} XP
                </span>
              </div>
              <Progress value={(relativeXp / relativeMaxXp) * 100} className="h-3 bg-secondary" color="bg-gradient-to-r from-primary to-violet-500" />
            </CardContent>
          </Card>

          <Card className="text-left shadow-lg hover:-translate-y-1 transition-all duration-300 border-primary/5">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Vault Balance & Streak</span>
              <Coins className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-display font-black text-3xl text-amber-500">{profile.coins}</span>
                  <span className="text-xs font-black text-amber-500 ml-1">Coins</span>
                </div>
                <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 text-orange-500 px-2.5 py-1 rounded-full font-black text-xs">
                  <Flame className="h-4 w-4 fill-current animate-bounce" />
                  <span>{profile.streak_days} Days</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold">Complete tasks and build habits to earn reward items.</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="py-10 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Loading profile...</span>
        </div>
      )}

      {/* 2. Main Page Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Challenges & Achievements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Challenges List */}
          <Card className="shadow-lg border-border">
            <CardHeader className="pb-3 border-b border-border/40 bg-secondary/5">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-left">
                <Compass className="h-4 w-4 text-primary animate-pulse" /> Active Missions & Challenges
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">Loading missions...</div>
              ) : challenges.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center font-semibold">No active missions available.</p>
              ) : (
                challenges.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border bg-secondary/5 gap-4"
                  >
                    <div className="space-y-1 text-left flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="text-xs font-black text-foreground">{ch.title}</h5>
                        <Badge variant="secondary" className="text-[9px] font-black uppercase">
                          {ch.type}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium">{ch.description}</p>
                      
                      {/* Challenge progress bar */}
                      <div className="flex items-center gap-3 pt-1">
                        <Progress value={(ch.current_value / ch.target_value) * 100} className="h-1.5 flex-grow max-w-[200px] bg-secondary" color="bg-emerald-500" />
                        <span className="text-[9px] font-black text-muted-foreground shrink-0">{ch.current_value} / {ch.target_value}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] text-primary font-black">+{ch.xp_reward} XP</span>
                        <span className="text-[9px] text-amber-500 font-black">+{ch.coins_reward} Coins</span>
                      </div>
                      {ch.is_completed ? (
                        <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500 text-xs px-2.5 py-1 font-black">
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs font-semibold">
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
          <Card className="shadow-lg">
            <CardHeader className="pb-3 border-b border-border/40 bg-secondary/5">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-left">
                <Award className="h-4 w-4 text-amber-500" /> Achievements Shelf
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.length === 0 ? (
                <p className="text-xs text-muted-foreground py-8 text-center col-span-2 font-semibold">No achievements loaded.</p>
              ) : (
                achievements.map((ach) => (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    key={ach.id}
                    className={cn(
                      'p-4 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer',
                      ach.is_unlocked
                        ? 'bg-secondary/10 border-border shadow-sm'
                        : 'bg-secondary/5 border-border/45 opacity-55'
                    )}
                  >
                    <span className="text-3xl shrink-0">
                      {ach.is_unlocked ? '🏆' : '🔒'}
                    </span>
                    <div className="space-y-1 text-left flex-grow min-w-0">
                      <h5 className="text-xs font-black text-foreground truncate flex items-center gap-1.5">
                        {ach.title}
                      </h5>
                      <p className="text-[9px] text-muted-foreground leading-normal line-clamp-2 font-semibold">
                        {ach.description}
                      </p>
                      <div className="flex gap-2 text-[8px] font-black uppercase">
                        <span className="text-primary">+{ach.xp_reward} XP</span>
                        <span className="text-amber-500">+{ach.coins_reward} Coins</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Leaderboard stand */}
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="pb-3 border-b border-border/40 bg-secondary/5">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-left">
                <Users className="h-4 w-4 text-primary animate-pulse" /> Global Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 divide-y divide-border/60">
              {leaderboard.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center font-semibold">Leaderboard is empty.</p>
              ) : (
                leaderboard.map((user) => {
                  const isCurrentUser = user.email === useAppStore.getState().user?.email

                  return (
                    <div
                      key={user.email}
                      className={cn(
                        'py-3 flex items-center justify-between gap-3 text-left',
                        isCurrentUser && 'bg-primary/5 rounded-xl px-3 -mx-1.5 border border-primary/20 shadow-sm'
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
                          <h6 className="text-xs font-black text-foreground truncate">
                            {user.username}
                          </h6>
                          <span className="text-[9px] text-muted-foreground block font-bold">
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
                            <Flame className="h-3 w-3 fill-current animate-bounce" />
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
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed font-semibold">
                  Excellent work! Your cognitive stamina is breaking records. You've earned bonus vault tokens.
                </p>
              </div>

              <Button
                variant="primary"
                onClick={() => setLevelUpOpen(false)}
                className="w-full mt-4 btn-bounce"
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

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={cn("animate-spin", className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

export default GamificationPage
