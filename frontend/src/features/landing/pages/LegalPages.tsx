import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Scale } from 'lucide-react'

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-left max-w-2xl mx-auto space-y-6">
      <div className="w-full flex items-center justify-between border-b pb-4">
        <Link to="/" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <span className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
          <ShieldCheck className="h-4 w-4 text-primary" /> Privacy Policy
        </span>
      </div>

      <div className="space-y-4">
        <h1 className="text-2xl font-black font-display tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground">Last updated: June 30, 2026</p>

        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider">1. Information We Collect</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Our application, Last Minute Life Saver (Nexora), requests access to your Google/Gmail account via the <code>gmail.readonly</code> scope. This access is strictly limited to reading metadata (subjects, sender address, and email receive times) of unread emails to automatically identify and compile upcoming task deadlines, assignments, and calendar sync alerts.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider">2. How We Use Data</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All email parsing is done dynamically using our secure AI Action Engine. The extracted deadlines and action titles are created as Tasks in your local productivity dashboard. We do not store the full body of your emails permanently, nor do we build a permanent database of your inbox.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider">3. Sharing and Third Parties</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We do not sell, distribute, share, or analyze your personal email data with any third-party marketing services or advertising partners. Your data is used exclusively to facilitate task creation for your own personal view inside the app.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider">4. Data Retention</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You can revoke access to your Gmail account at any time via the Settings page or directly from your Google Security Settings console. Revoking access will immediately stop all background email checks.
          </p>
        </section>
      </div>

      <div className="w-full text-center pt-8 border-t text-[10px] text-muted-foreground">
        © 2026 Last Minute Life Saver. All rights reserved.
      </div>
    </div>
  )
}

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-left max-w-2xl mx-auto space-y-6">
      <div className="w-full flex items-center justify-between border-b pb-4">
        <Link to="/" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <span className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
          <Scale className="h-4 w-4 text-primary" /> Terms of Service
        </span>
      </div>

      <div className="space-y-4">
        <h1 className="text-2xl font-black font-display tracking-tight">Terms of Service</h1>
        <p className="text-xs text-muted-foreground">Last updated: June 30, 2026</p>

        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider">1. Agreement to Terms</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            By accessing or using Last Minute Life Saver, you agree to be bound by these terms. If you do not agree, please do not use the application.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider">2. Account Responsibility</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You are responsible for keeping your credentials and OAuth authentication states secure. You must not use the application to scrape data, send spam, or bypass rate limits.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider">3. Google APIs Usage</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Our app connects to Google's API services. Usage of Google account connections is subject to Google's API User Data Policy and their terms of service. You represent that you own or have permission to connect the linked Google account.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wider">4. Disclaimers</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This productivity companion is provided "as is" without warranty of any kind. While we do our best to parse emails and identify deadlines, we are not responsible for missed school or work deadlines.
          </p>
        </section>
      </div>

      <div className="w-full text-center pt-8 border-t text-[10px] text-muted-foreground">
        © 2026 Last Minute Life Saver. All rights reserved.
      </div>
    </div>
  )
}
