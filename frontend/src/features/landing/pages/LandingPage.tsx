import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Trophy,
  Activity,
  Flame,
  Brain,
  Shield,
  Zap,
  Calendar,
  Sparkles,
  ArrowRight,
  Send,
  CheckCircle,
  Lock,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'

// Inline SVGs for Socials
const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
)

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
)

const userExperiences = [
  {
    name: 'Sarah K.',
    role: 'Computer Science Major',
    avatar: '👑',
    text: 'Broke down my heavy 10-page operating systems thesis into 20 micro-tasks. Saved me from a late submission!',
    tag: 'Task Planner'
  },
  {
    name: 'David L.',
    role: 'Full Stack Developer',
    avatar: '⚡',
    text: 'Offline sync works flawlessly. I log tasks on my train commute, and the app auto-syncs when I step in the office.',
    tag: 'Offline Sync'
  },
  {
    name: 'Emily R.',
    role: 'Digital Designer',
    avatar: '🔥',
    text: 'The gamified levels and daily missions keep me incredibly motivated. Reached Level 15 and unlocked custom UI themes!',
    tag: 'Gamification'
  },
  {
    name: 'Marcus T.',
    role: 'UX Researcher',
    avatar: '🤖',
    text: 'The AI Coach analytics recommendations are extremely precise. It knows exactly when my daily focus peaks.',
    tag: 'AI Coach'
  },
]

const scrollExperiences = [...userExperiences, ...userExperiences, ...userExperiences]

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#030303] text-foreground overflow-hidden relative selection:bg-primary selection:text-primary-foreground">
      {/* CSS Dotted Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Radial Glows */}
      <div className="absolute top-[-10%] left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-white/[0.08] backdrop-blur-md bg-[#030303]/80 sticky top-0 z-50 h-[72px]">
        <div className="max-w-6xl mx-auto px-6 h-full flex justify-between items-center">
          {/* Stylized Neon Logo */}
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 overflow-hidden">
              <Zap className="h-5.5 w-5.5 fill-current animate-pulse z-10" />
              <div className="absolute inset-0 border border-white/20 rounded-xl" />
            </div>
            <div className="text-left">
              <span className="font-display font-black text-sm tracking-tight uppercase block leading-none text-foreground">
                Nexora
              </span>
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest block mt-1">
                AI Productivity
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-xs font-bold uppercase tracking-wider">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" className="text-xs font-bold uppercase tracking-wider px-5 h-9">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center space-y-8 relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full text-xs font-bold text-primary"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Gamified AI Productivity Companion
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl mx-auto font-display font-black text-4xl sm:text-6xl tracking-tight leading-[1.05] text-foreground"
        >
          Defeat Deadlines. Level Up Your <span className="text-primary bg-clip-text">Cognitive Output.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl mx-auto text-muted-foreground text-sm sm:text-base leading-relaxed"
        >
          An offline-first, AI-powered planner designed to rescue you from deadlines. Earn coins, check off habits, and unlock rewards as you defeat procrastination.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-center gap-4 flex-wrap pb-8"
        >
          <Link to="/signup">
            <Button size="lg" variant="primary" className="font-bold uppercase tracking-wider gap-2 px-8 h-12 rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform duration-200">
              Embark on Quest <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="font-bold uppercase tracking-wider px-8 h-12 rounded-xl hover:-translate-y-0.5 transition-transform duration-200">
              Claim Rewards
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Product Preview / Mockup Container */}
      <section className="max-w-5xl mx-auto px-6 pb-24 relative">
        {/* Glow behind mockup */}
        <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full scale-75 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, delay: 0.4 }}
          className="relative rounded-2xl border border-white/[0.08] bg-zinc-950/60 backdrop-blur-md shadow-2xl p-6 text-left"
        >
          {/* Mac window controls */}
          <div className="flex gap-1.5 mb-6 border-b border-white/[0.05] pb-4">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="text-[10px] text-muted-foreground ml-3 font-semibold tracking-wider uppercase">PWA Sync Interface</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Tasks Checklists */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase text-foreground">Interactive Tasks Checklist</h4>
                <Badge variant="success" className="text-[9px] uppercase tracking-wider font-bold">AI Organized</Badge>
              </div>
              <div className="space-y-2">
                {[
                  { title: 'Bake indices into database schemas', priority: 'high', checked: true },
                  { title: 'Synchronize IndexedDB offline queue', priority: 'urgent', checked: false },
                  { title: 'Validate FCM push certificate PEM payload', priority: 'medium', checked: false }
                ].map((task, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.05] bg-white/[0.01]">
                    <CheckCircle className={`h-4 w-4 shrink-0 ${task.checked ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-xs flex-1 ${task.checked ? 'line-through text-muted-foreground' : 'text-foreground font-semibold'}`}>
                      {task.title}
                    </span>
                    <Badge variant={task.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-[8px] uppercase">
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: Quick Stats bar */}
            <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-xl flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <h5 className="text-[10px] font-black uppercase text-muted-foreground">Gamified Status Bar</h5>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Active Streak</span>
                  <span className="text-xs font-black text-orange-500 flex items-center gap-1">
                    <Flame className="h-4.5 w-4.5 fill-current" /> 7 Days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Level</span>
                  <span className="text-xs font-black text-primary">Level 14</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Coins Vault</span>
                  <span className="text-xs font-black text-amber-500 flex items-center gap-1">
                    <Trophy className="h-4 w-4" /> 450
                  </span>
                </div>
              </div>

              <div className="border-t border-white/[0.05] pt-3">
                <Progress value={65} className="h-1.5" />
                <span className="text-[8px] text-muted-foreground mt-1.5 block">850 / 2,000 XP to next level</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Bento Grid Section */}
      <section className="max-w-6xl mx-auto px-6 pb-28 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="font-display font-black text-3xl">Loaded Bento Capabilities</h2>
          <p className="text-xs text-muted-foreground">Everything you need to navigate deadlines and align habits.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: AI Planner (Double size on desktop) */}
          <Card className="text-left p-6 md:col-span-2 space-y-4 hover:border-primary/30 transition-colors bg-zinc-950/40 border-white/[0.06]">
            <Brain className="h-8 w-8 text-primary" />
            <h3 className="font-display font-bold text-lg">AI Cognitive Planner</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Autogenerates task checklists for heavy assignments. Analyzes deadlines, suggests checklists, and maps sub-tasks instantly using local LLM contexts.
            </p>
            <div className="pt-2 border-t border-white/[0.05] flex justify-between text-[10px] text-muted-foreground">
              <span>Dynamic subtask generator</span>
              <span className="text-primary font-bold">Enabled</span>
            </div>
          </Card>

          {/* Card 2: Heatmap */}
          <Card className="text-left p-6 space-y-4 hover:border-primary/30 transition-colors bg-zinc-950/40 border-white/[0.06]">
            <Calendar className="h-8 w-8 text-emerald-500" />
            <h3 className="font-display font-bold text-lg">Focus Heatmap</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Log daily deep work hours, check statistics, and monitor focus distributions on a chronological grid.
            </p>
          </Card>

          {/* Card 3: Gamification */}
          <Card className="text-left p-6 space-y-4 hover:border-primary/30 transition-colors bg-zinc-950/40 border-white/[0.06]">
            <Trophy className="h-8 w-8 text-amber-500" />
            <h3 className="font-display font-bold text-lg">Gamification Engine</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Earn XP, level up, check off daily achievements, and claim coin rewards to purchase retro theme customizations.
            </p>
          </Card>

          {/* Card 4: Offline Synchronization (Double size on desktop) */}
          <Card className="text-left p-6 md:col-span-2 space-y-4 hover:border-primary/30 transition-colors bg-zinc-950/40 border-white/[0.06]">
            <Activity className="h-8 w-8 text-indigo-400" />
            <h3 className="font-display font-bold text-lg">Offline-First Synchronizer</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Wired to local IndexedDB storage. Actions are queued offline and automatically pushed to the Django sync gateway with Last-Write-Wins conflict resolution on reconnect.
            </p>
            <div className="pt-2 border-t border-white/[0.05] flex justify-between text-[10px] text-muted-foreground">
              <span>Offline queue status</span>
              <span className="text-indigo-400 font-bold">Ready</span>
            </div>
          </Card>
        </div>
      </section>

      {/* Testimonials / User Experience Marquee */}
      <section className="pb-28 space-y-6">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            User Journeys & Experiences
          </h2>
        </div>

        <div className="relative flex overflow-x-hidden border-y border-white/[0.06] py-6 bg-white/[0.01]">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#030303] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#030303] to-transparent z-10 pointer-events-none" />

          <motion.div
            className="flex gap-6 shrink-0"
            animate={{ x: [0, -1920] }}
            transition={{
              ease: 'linear',
              duration: 35,
              repeat: Infinity,
            }}
          >
            {scrollExperiences.map((exp, idx) => (
              <div
                key={idx}
                className="w-[280px] p-5 rounded-2xl border border-white/[0.08] bg-zinc-900/40 text-left flex flex-col justify-between gap-4 shrink-0 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl">{exp.avatar}</span>
                    <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-bold">
                      {exp.tag}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-normal line-clamp-3">
                    "{exp.text}"
                  </p>
                </div>

                <div className="border-t border-white/[0.05] pt-2 text-[10px]">
                  <h5 className="font-bold text-foreground">{exp.name}</h5>
                  <span className="text-muted-foreground">{exp.role}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Detailed Footer */}
      <footer className="border-t border-white/[0.06] bg-zinc-950/40 pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-10 text-left">
          {/* Brand Info Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-primary-foreground shadow-lg">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <span className="font-display font-black text-lg tracking-tight uppercase">
                Nexora
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Level up your productivity workflow with offline sync, automated AI planners, and cognitive tracking frameworks built for high-performers.
            </p>
            <div className="flex gap-4">
              <Link to="#" className="text-muted-foreground hover:text-foreground">
                <TwitterIcon className="h-4.5 w-4.5" />
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-foreground">
                <GithubIcon className="h-4.5 w-4.5" />
              </Link>
            </div>
          </div>

          {/* Column 2: Product */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-foreground tracking-wider font-display">Product</h5>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link to="/login" className="hover:text-foreground">AI Planner</Link></li>
              <li><Link to="/login" className="hover:text-foreground">Gamification Core</Link></li>
              <li><Link to="/login" className="hover:text-foreground">Analytics Console</Link></li>
              <li><Link to="/login" className="hover:text-foreground">Offline Sync</Link></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-foreground tracking-wider font-display">Resources</h5>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link to="#" className="hover:text-foreground">Documentation</Link></li>
              <li><Link to="#" className="hover:text-foreground">API Status</Link></li>
              <li><Link to="#" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link to="#" className="hover:text-foreground">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Column 4: Stay Updated */}
          <div className="space-y-3">
            <h5 className="text-xs font-black uppercase text-foreground tracking-wider font-display">Stay Updated</h5>
            <p className="text-xs text-muted-foreground">Subscribe to receive productivity updates and features updates.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="you@domain.com"
                className="flex h-9 w-full rounded-md border border-white/[0.08] bg-zinc-950/60 px-3 py-1 text-xs placeholder:text-muted-foreground focus-visible:outline-none"
              />
              <Button size="sm" variant="primary" className="h-9 px-3">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 border-t border-white/[0.06] mt-12 pt-6 text-center text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} Nexora. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="#" className="hover:underline">Privacy Policy</Link>
            <Link to="#" className="hover:underline">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
