import Link from 'next/link';
import { Plane, Receipt, ShieldCheck, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 border-b border-zinc-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="w-6 h-6 text-indigo-600" />
          <span className="font-bold text-xl tracking-tight">TripAxis</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            Log in
          </Link>
          <Link href="/signup" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="py-24 px-6 max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 mb-6">
            Modern corporate travel, <br className="hidden md:block" />
            <span className="text-indigo-600">simplified.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 mb-10 max-w-2xl mx-auto">
            TripAxis is the all-in-one platform for managing travel requests, enforcing policies, and processing expenses with ease.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/demo" className="flex items-center gap-2 bg-white text-zinc-900 border border-zinc-200 px-6 py-3 rounded-xl font-medium hover:bg-zinc-50 transition-colors">
              Book a Demo
            </Link>
          </div>
        </section>

        <section className="py-20 bg-white border-t border-zinc-100">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                <Plane className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Travel Requests</h3>
              <p className="text-zinc-600">Streamline the booking process with automated approvals and real-time status updates.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Policy Enforcement</h3>
              <p className="text-zinc-600">Ensure compliance with dynamic, tenant-specific travel policies evaluated in real-time.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
                <Receipt className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Expense Management</h3>
              <p className="text-zinc-600">Submit, review, and approve expenses effortlessly with integrated receipt tracking.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-zinc-500 border-t border-zinc-200 bg-white">
        &copy; {new Date().getFullYear()} TripAxis. All rights reserved.
      </footer>
    </div>
  );
}
