"use client";
import { Github, Linkedin, Mail } from "lucide-react";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

export default function Home() {
  const [authed, setAuthed] = React.useState<boolean | null>(null);
  const [activeSection, setActiveSection] = React.useState("home");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await api.session();
        if (!cancelled) setAuthed(true);
      } catch {
        if (!cancelled) setAuthed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* 🔥 HEADER */}
      <header className="sticky top-0 z-20 border-b border-[#1e293b] bg-[#020617]/70 backdrop-blur-xl">
        <div className="mx-auto grid max-w-6xl grid-cols-3 items-center px-4 py-3">
          {/* LEFT: LOGO */}
          <div className="flex items-center gap-3 font-semibold tracking-tight">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 text-black shadow-md">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg">PathWise</span>
          </div>

          {/* CENTER: NAV */}
          <div className="flex justify-center gap-6 text-sm">
            {["home", "about", "contact"].map((item) => (
              <button
                key={item}
                onClick={() => setActiveSection(item)}
                className={`transition font-medium ${activeSection === item
                  ? "text-white"
                  : "text-gray-400 hover:text-white"
                  }`}
              >
                {item === "home"
                  ? "Home"
                  : item === "about"
                    ? "About Us"
                    : "Contact Us"}
              </button>
            ))}
          </div>

          {/* RIGHT: ACTION */}
          <div className="flex justify-end items-center gap-3">
            {authed ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-black hover:bg-green-400 transition"
              >
                Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-black hover:bg-green-400 transition"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 🔥 MAIN */}
      <main className="mx-auto max-w-6xl px-4 pt-4 pb-12 transition-all duration-300">
        {/* 🏠 HOME */}
        {activeSection === "home" && (
          <>
            <div className="grid gap-6 md:grid-cols-2 items-center">
              {/* LEFT */}
              <div className="space-y-6">
                <p className="inline-flex items-center rounded-full border border-[#1e293b] px-4 py-1 text-xs text-green-400">
                  AI-powered career intelligence
                </p>

                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  Build your career path with
                  <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                    {" "}
                    clarity & confidence
                  </span>
                </h1>

                <p className="text-lg text-gray-400">
                  PathWise analyzes your skills and interests to generate career
                  recommendations, identify gaps, and guide you with a
                  structured roadmap.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  {!authed && (
                    <Link
                      href="/auth"
                      className="inline-flex h-12 items-center justify-center rounded-lg bg-green-500 px-6 text-sm font-semibold text-black hover:bg-green-400 transition shadow-lg"
                    >
                      Start your journey <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  )}

                  <Link
                    href="/dashboard"
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-[#1e293b] px-6 text-sm font-medium hover:bg-[#020617]/80 transition"
                  >
                    Explore dashboard
                  </Link>
                </div>
              </div>

              {/* RIGHT CARD */}
              <div className="rounded-2xl border border-[#1e293b] bg-[#020617]/60 backdrop-blur-xl p-6">
                <div className="space-y-4">
                  <div className="text-sm font-semibold">Top Matches</div>

                  {[
                    { name: "Data Science", score: 86 },
                    { name: "Full-Stack Dev", score: 79 },
                    { name: "Cloud & DevOps", score: 73 },
                  ].map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">{item.name}</span>
                        <span className="text-green-400">{item.score}%</span>
                      </div>
                      <div className="h-2 w-full bg-[#1e293b] rounded-full">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FEATURES */}
            <section className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Explainable AI",
                  desc: "Transparent scoring using similarity, skills, and weighted logic.",
                },
                {
                  title: "Smart Roadmaps",
                  desc: "Step-by-step path from beginner to advanced with real skills.",
                },
                {
                  title: "Adaptive Learning",
                  desc: "Recommendations improve based on your feedback & tests.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-[#1e293b] p-6"
                >
                  <div className="font-semibold">{f.title}</div>
                  <p className="text-sm text-gray-400 mt-2">{f.desc}</p>
                </div>
              ))}
            </section>
          </>
        )}

        {activeSection === "about" && (
          <div className="min-h-[80vh] flex flex-col justify-center space-y-10">
            {/* 🔹 HERO */}
            <div className="max-w-4xl">
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Building the future of
                <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  {" "}
                  career intelligence
                </span>
              </h2>

              <p className="mt-6 text-lg text-gray-400 leading-relaxed">
                PathWise is an AI-powered platform designed to remove confusion
                from career decisions. It analyzes your skills, interests, and
                goals to deliver structured, data-driven career paths — not just
                suggestions, but clear direction with reasoning.
              </p>
            </div>

            {/* 🔹 FOUNDER CARD (UPGRADED UI) */}
            <div className="relative rounded-2xl border border-green-500/20 bg-gradient-to-br from-[#020617] to-[#020617]/80 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <div className="absolute inset-0 rounded-2xl bg-green-500/5 blur-2xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  {/* LEFT */}
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    Jinny Kapur
                    {/* GITHUB */}
                    <a
                      href="https://github.com/jinnykapur"
                      target="_blank"
                      className="text-gray-400 hover:text-white transition"
                    >
                      <Github className="h-5 w-5" />
                    </a>
                    {/* LINKEDIN */}
                    <a
                      href="https://linkedin.com/in/jinnykapur"
                      target="_blank"
                      className="text-gray-400 hover:text-white transition"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                    {/* EMAIL */}
                    <a
                      href="mailto:jinnykapur@gmail.com"
                      className="text-gray-400 hover:text-white transition"
                    >
                      <Mail className="h-5 w-5" />
                    </a>
                  </h3>

                  <div className="text-sm text-gray-400">
                    Computer Science Engineering Student
                  </div>
                </div>

                <p className="mt-6 text-gray-400 leading-relaxed max-w-3xl">
                  We built PathWise to solve a real problem — the overwhelming
                  confusion students face when choosing a career. Instead of
                  random suggestions, I wanted to create a system that
                  understands a person and guides them logically.
                </p>

                <p className="mt-4 text-gray-400 leading-relaxed max-w-3xl">
                  This project combines artificial intelligence, backend
                  systems, and modern frontend design to deliver meaningful
                  career insights. My focus was not just building features, but
                  creating clarity through technology.
                </p>

                {/* 🔗 BUTTON STYLE LINKS (OPTIONAL NICE TOUCH) */}
                <div className="mt-6 flex gap-3 flex-wrap">
                  <a
                    href="https://github.com/jinnykapur"
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1e293b] text-sm text-gray-300 hover:text-white hover:border-green-500/30 transition"
                  >
                    <Github className="h-4 w-4" /> GitHub
                  </a>

                  <a
                    href="https://linkedin.com/in/jinnykapur"
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1e293b] text-sm text-gray-300 hover:text-white hover:border-green-500/30 transition"
                  >
                    <Linkedin className="h-4 w-4" /> LinkedIn
                  </a>

                  <a
                    href="mailto:jinnykapur@gmail.com"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1e293b] text-sm text-gray-300 hover:text-white hover:border-green-500/30 transition"
                  >
                    <Mail className="h-4 w-4" /> Email
                  </a>
                </div>

                {/* TECH STACK */}
                <div className="mt-8">
                  <h4 className="text-lg font-semibold mb-3 text-white">
                    ⚙️ Built With
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {[
                      "Next.js",
                      "React",
                      "Node.js",
                      "MongoDB",
                      "TensorFlow",
                      "Tailwind CSS",
                      "AI/ML Models",
                    ].map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 text-xs rounded-full border border-[#1e293b] text-gray-300 hover:border-green-500/30 hover:text-white transition"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 🔹 FUTURE TEAM (COMMENTED) */}
            {
              <div>
                <h3 className="text-2xl font-bold mb-6">👨‍💻 Meet the Team</h3>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">

                  <div className="p-6 rounded-xl border border-[#1e293b] bg-[#020617]">
                    <div className="text-lg font-semibold">Jinny Kapur(Team Leader)</div>
                    <p className="text-sm text-gray-400">AI Engine & Backend Development</p>
                  </div>
                  <div className="p-6 rounded-xl border border-[#1e293b] bg-[#020617]">
                    <div className="text-lg font-semibold">Sanyam Bhatia</div>
                    <p className="text-sm text-gray-400">Frontend Development</p>
                  </div>

                  <div className="p-6 rounded-xl border border-[#1e293b] bg-[#020617]">
                    <div className="text-lg font-semibold">Aditya Sharma</div>
                    <p className="text-sm text-gray-400">API & System Design</p>
                  </div>

                </div>
              </div>
            }
          </div>
        )}
        {activeSection === "contact" && (
          <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="w-full max-w-2xl text-center">
              {/* 🔹 HEADING */}
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Let’s build something
                <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  {" "}
                  great together
                </span>
              </h2>

              <p className="mt-4 text-gray-400 max-w-xl mx-auto">
                Whether you have feedback, ideas, or just want to connect — drop
                a message below. I read every message and usually respond
                quickly.
              </p>

              {/* 🔹 FORM CARD */}
              <div className="relative mt-10 rounded-2xl border border-green-500/20 bg-[#020617]/60 backdrop-blur-xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-left">
                {/* glow */}
                <div className="absolute inset-0 rounded-2xl bg-green-500/5 blur-2xl pointer-events-none" />

                <div className="relative z-10">
                  <form className="space-y-5">
                    {/* NAME */}
                    <div>
                      <label className="text-sm text-gray-400">Name</label>
                      <input
                        type="text"
                        placeholder="Enter your name"
                        className="mt-1 w-full px-4 py-3 rounded-lg bg-[#020617] border border-[#1e293b] text-sm outline-none focus:border-green-500 transition"
                      />
                    </div>

                    {/* EMAIL */}
                    <div>
                      <label className="text-sm text-gray-400">Email</label>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        className="mt-1 w-full px-4 py-3 rounded-lg bg-[#020617] border border-[#1e293b] text-sm outline-none focus:border-green-500 transition"
                      />
                    </div>

                    {/* MESSAGE */}
                    <div>
                      <label className="text-sm text-gray-400">Message</label>
                      <textarea
                        rows={4}
                        placeholder="Write your message..."
                        className="mt-1 w-full px-4 py-3 rounded-lg bg-[#020617] border border-[#1e293b] text-sm outline-none focus:border-green-500 transition"
                      />
                    </div>

                    {/* BUTTON */}
                    <button
                      type="submit"
                      className="w-full mt-2 bg-green-500 hover:bg-green-400 text-black font-medium py-3 rounded-lg transition shadow-lg"
                    >
                      Send Message →
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
