// ============================================
// MindFlow — Landing Page
// A stunning entry point that converts visitors
// ============================================
import Link from "next/link";
import {
  Brain,
  CheckCircle2,
  Bell,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-chart-2/10 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 h-[400px] w-[400px] rounded-full bg-chart-3/10 blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">MindFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-sm font-medium">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              size="sm"
              className="gradient-primary border-0 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            >
              Get Started Free
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-5xl px-6 pt-20 pb-32 text-center md:pt-32">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          AI-Powered Productivity
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.15] tracking-tight md:text-6xl md:leading-[1.1]">
          Your thoughts,{" "}
          <span className="bg-gradient-to-r from-primary via-chart-2 to-chart-5 bg-clip-text text-transparent">
            beautifully organized
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
          Notes, tasks, and reminders — all in one blazing-fast app.
          AI-powered summaries, rich editing, and a design that sparks joy.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/signup">
            <Button
              size="lg"
              className="h-12 px-8 text-base gradient-primary border-0 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 animate-pulse-glow"
            >
              Start for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base"
            >
              I already have an account
            </Button>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Brain,
              title: "Smart Notes",
              desc: "Rich editor with AI summaries, tags, and folders",
              gradient: "from-violet-500 to-purple-600",
            },
            {
              icon: CheckCircle2,
              title: "Tasks & Todos",
              desc: "Subtasks, priorities, drag & drop, progress tracking",
              gradient: "from-emerald-500 to-teal-600",
            },
            {
              icon: Bell,
              title: "Reminders",
              desc: "Never miss a beat with push notifications",
              gradient: "from-amber-500 to-orange-600",
            },
            {
              icon: Sparkles,
              title: "AI Powered",
              desc: "Summarize, extract actions, smart suggestions",
              gradient: "from-pink-500 to-rose-600",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-border/50 bg-card/50 p-6 text-left backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
            >
              <div
                className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}
              >
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-semibold">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-20 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          {[
            { icon: Zap, text: "Blazing Fast" },
            { icon: Shield, text: "Secure & Private" },
            { icon: Smartphone, text: "Works Everywhere" },
          ].map((badge) => (
            <div key={badge.text} className="flex items-center gap-2">
              <badge.icon className="h-4 w-4 text-primary" />
              <span>{badge.text}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 px-6 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} MindFlow. Built with ❤️ for productivity.
      </footer>
    </div>
  );
}
