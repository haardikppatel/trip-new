'use client';

import { motion } from 'motion/react';
import { ArrowRight, Plane, ShieldCheck, Clock, Globe } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#110E0A] text-[#D5D6D5] font-sans selection:bg-[#9A6022] selection:text-white flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-5 border-b border-[#3E392E]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-[#9A6022] p-2 rounded-lg">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-display">TripAxis</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-[#B6B3AD] hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="px-5 py-2.5 text-sm font-medium bg-[#9A6022] text-white rounded-lg hover:bg-[#8F816B] transition-colors shadow-lg shadow-[#9A6022]/20">
            Request Demo
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3E392E] border border-[#8F816B]/30 text-[#B6B3AD] text-xs font-medium uppercase tracking-wider mb-8">
            <span className="w-2 h-2 rounded-full bg-[#9A6022] animate-pulse"></span>
            Module 1 Now Live
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8 font-display leading-tight">
            Corporate Travel, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9A6022] to-[#8F816B]">
              Perfectly Orchestrated.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-[#B6B3AD] mb-12 max-w-2xl mx-auto leading-relaxed">
            TripAxis unifies travel booking, automated SLA approvals, and expense reconciliation into a single, secure platform for the modern enterprise.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 text-base font-medium bg-[#9A6022] text-white rounded-xl hover:bg-[#8F816B] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#9A6022]/20 group">
              Enter Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/policy" className="w-full sm:w-auto px-8 py-4 text-base font-medium bg-[#3E392E] text-white rounded-xl hover:bg-[#3E392E]/80 border border-[#8F816B]/30 transition-all flex items-center justify-center gap-2">
              View Features
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-32 text-left"
        >
          <FeatureCard 
            icon={<Plane className="w-6 h-6 text-[#9A6022]" />}
            title="Global Booking"
            description="Integrated flight and hotel search with auto-applied corporate codes and policy checks."
          />
          <FeatureCard 
            icon={<Clock className="w-6 h-6 text-[#9A6022]" />}
            title="SLA Escalations"
            description="Automated approval routing with 50% reminders and 100% automatic escalations."
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-6 h-6 text-[#9A6022]" />}
            title="Policy Compliance"
            description="Real-time validation against grade entitlements, blackout dates, and budget limits."
          />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#3E392E]/50 py-8 text-center text-sm text-[#B6B3AD]">
        <p>© {new Date().getFullYear()} TripAxis Enterprise SaaS. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-[#3E392E]/30 border border-[#8F816B]/20 hover:bg-[#3E392E]/50 hover:border-[#8F816B]/40 transition-all group">
      <div className="w-12 h-12 rounded-xl bg-[#110E0A] border border-[#3E392E] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3 font-display">{title}</h3>
      <p className="text-[#B6B3AD] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
