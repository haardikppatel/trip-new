"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, Calendar, MapPin, DollarSign, CheckCircle2, Clock } from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("requests");

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-indigo-600" />
          <span className="font-bold text-lg">TripAxis Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
            JD
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Welcome back, John</h1>
          <Button className="bg-indigo-600 hover:bg-indigo-700">New Request</Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Approvals</CardDescription>
              <CardTitle className="text-4xl font-light">3</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Upcoming Trips</CardDescription>
              <CardTitle className="text-4xl font-light">1</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unsubmitted Expenses</CardDescription>
              <CardTitle className="text-4xl font-light">$450</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="flex border-b border-zinc-200">
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-6 py-3 text-sm font-medium ${activeTab === "requests" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-zinc-500 hover:text-zinc-700"}`}
            >
              Travel Requests
            </button>
            <button
              onClick={() => setActiveTab("expenses")}
              className={`px-6 py-3 text-sm font-medium ${activeTab === "expenses" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-zinc-500 hover:text-zinc-700"}`}
            >
              Expenses
            </button>
          </div>
          
          <div className="p-6">
            {activeTab === "requests" && (
              <div className="space-y-4">
                {[
                  { dest: "San Francisco, CA", date: "Oct 12 - Oct 15", status: "Approved", icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
                  { dest: "London, UK", date: "Nov 05 - Nov 10", status: "Pending", icon: <Clock className="w-5 h-5 text-amber-500" /> },
                ].map((req, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-zinc-100 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-zinc-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-zinc-900">{req.dest}</h4>
                        <div className="flex items-center gap-1 text-sm text-zinc-500 mt-1">
                          <Calendar className="w-3 h-3" /> {req.date}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.icon}
                      <span className="text-sm font-medium text-zinc-700">{req.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "expenses" && (
              <div className="space-y-4">
                {[
                  { desc: "Client Dinner", amount: "$120.50", status: "Pending", icon: <Clock className="w-5 h-5 text-amber-500" /> },
                  { desc: "Uber to Airport", amount: "$45.00", status: "Approved", icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
                ].map((exp, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-zinc-100 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-zinc-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-zinc-900">{exp.desc}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-medium">{exp.amount}</span>
                      <div className="flex items-center gap-1">
                        {exp.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
