"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Box,
  Check,
  ChevronDown,
  FileCheck2,
  ImageIcon,
  Menu,
  MousePointer2,
  PackageCheck,
  Search,
  ShoppingCart,
  ShieldCheck,
  Sparkles,
  Target,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { agents } from "@/lib/agents";
import { FULL_GENERATION_COST, SUBSCRIPTION_PLANS } from "@/lib/credits";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const navItems = [
  { label: "The Crew", href: "#crew" },
  { label: "How It Works", href: "#workflow" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Pricing", href: "#pricing" },
];

const capabilities = [
  {
    icon: Search,
    title: "Product & Market Research",
    description:
      "Raed and Fares turn product details, competitor context, and market signals into a clear listing direction.",
    color: "#035EF9",
  },
  {
    icon: Target,
    title: "Amazon SEO",
    description:
      "Nadeem maps search intent and places the right keywords naturally across every part of the listing.",
    color: "#3EC9D1",
  },
  {
    icon: WandSparkles,
    title: "Conversion Copy",
    description:
      "Hakim and Bayan build the strategy, title, bullets, description, and brand voice as one persuasive story.",
    color: "#7E44E6",
  },
  {
    icon: ShieldCheck,
    title: "Policy Compliance",
    description:
      "Saleem reviews claims and content against Amazon policy before the listing reaches final review.",
    color: "#E82E33",
  },
  {
    icon: ImageIcon,
    title: "Visual Direction",
    description:
      "Noor, Rayan, and Adam shape image concepts, creative briefs, and prompts that support the listing message.",
    color: "#FC7403",
  },
  {
    icon: FileCheck2,
    title: "Final Quality Review",
    description:
      "Badr checks consistency, clarity, completeness, and readiness before Ali assembles the final output.",
    color: "#60697A",
  },
];

const workflow = [
  {
    number: "01",
    title: "Share the product",
    description: "Add the product name, features, target keywords, and competitor context.",
  },
  {
    number: "02",
    title: "The crew gets to work",
    description: "Specialist agents research, strategize, write, optimize, and review in sequence.",
  },
  {
    number: "03",
    title: "Review one complete listing",
    description: "Get the title, bullets, description, backend keywords, and compliance notes together.",
  },
  {
    number: "04",
    title: "Refine and publish",
    description: "Keep the final output organized in your workspace and ready for your Amazon workflow.",
  },
];

const heroCommerceDecor = [
  { icon: ShoppingCart, x: "3%", y: "27%", delay: 0, size: 42 },
  { icon: Box, x: "91%", y: "19%", delay: 0.8, size: 38 },
  { icon: BarChart3, x: "94%", y: "69%", delay: 1.6, size: 46 },
  { icon: MousePointer2, x: "5%", y: "78%", delay: 2.2, size: 34 },
  { icon: Search, x: "52%", y: "12%", delay: 1.2, size: 32 },
];

const agentStates = [
  "Coordinating",
  "Researching",
  "Analyzing",
  "Reviewing images",
  "Building strategy",
  "Checking policy",
  "Writing copy",
  "Optimizing SEO",
  "Directing creative",
  "Tuning prompts",
  "Final QA",
];

const faqs = [
  {
    question: "Why use a crew of agents instead of one AI prompt?",
    answer:
      "Each SellerCrew agent owns a specific part of the listing workflow. Research, strategy, copy, SEO, compliance, creative direction, and QA are handled as connected specialist tasks instead of one oversized prompt.",
  },
  {
    question: "What does one full generation include?",
    answer:
      "A full run coordinates the specialist crew to produce the core listing copy, keyword direction, compliance review, creative guidance, and final quality check. A complete run currently costs 95 credits.",
  },
  {
    question: "Can I work across multiple products or brands?",
    answer:
      "Yes. SellerCrew organizes work into projects and workspaces so listings, assets, team activity, and usage can stay separated.",
  },
  {
    question: "Does SellerCrew replace final seller review?",
    answer:
      "SellerCrew accelerates research and production, but the seller remains responsible for checking product facts, marketplace requirements, and the final listing before publishing.",
  },
];

function SectionHeading({
  label,
  title,
  description,
  light = false,
}: {
  label: string;
  title: string;
  description: string;
  light?: boolean;
}) {
  return (
    <motion.div
      variants={reveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="mx-auto max-w-3xl text-center"
    >
      <p
        className={`mb-4 text-xs font-bold uppercase tracking-[0.24em] ${
          light ? "text-white/50" : "text-[#035EF9]"
        }`}
      >
        {label}
      </p>
      <h2
        className={`text-balance text-3xl font-bold tracking-[-0.04em] sm:text-5xl ${
          light ? "text-white" : "text-[#0B0F1A]"
        }`}
      >
        {title}
      </h2>
      <p
        className={`mx-auto mt-5 max-w-2xl text-base leading-7 sm:text-lg ${
          light ? "text-white/55" : "text-slate-500"
        }`}
      >
        {description}
      </p>
    </motion.div>
  );
}

function Navbar() {
  const setView = useAppStore((state) => state.setView);
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4"
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-[#0B0F1A]/75 px-4 shadow-2xl shadow-black/10 backdrop-blur-xl sm:px-6">
        <a href="#" className="flex items-center gap-2.5" aria-label="SellerCrew home">
          <Image
            src="/logo2.png"
            alt=""
            width={38}
            height={38}
            className="rounded-xl"
            priority
          />
          <span className="text-[17px] font-extrabold tracking-[-0.055em] text-white sm:text-xl">
            sellercrew
          </span>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-white/60 transition hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            className="text-white/65 hover:bg-white/5 hover:text-white"
            onClick={() => setView("auth")}
          >
            Sign in
          </Button>
          <Button
            className="rounded-xl bg-white text-[#0B0F1A] hover:bg-white/90"
            onClick={() => setView("auth")}
          >
            Start building
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          className="rounded-lg p-2 text-white md:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-2 max-w-7xl rounded-2xl border border-white/10 bg-[#0B0F1A]/95 p-4 shadow-2xl backdrop-blur-xl md:hidden"
        >
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <Button
              className="mt-3 rounded-xl bg-white text-[#0B0F1A]"
              onClick={() => setView("auth")}
            >
              Start building
            </Button>
          </div>
        </motion.div>
      ) : null}
    </motion.header>
  );
}

function Hero() {
  const setView = useAppStore((state) => state.setView);

  return (
    <section className="relative flex min-h-[920px] items-center overflow-hidden bg-[#080C16] px-5 pb-24 pt-32 sm:min-h-screen sm:px-8">
      <div className="sellercrew-grid absolute inset-0 opacity-30" />
      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -24, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-40 top-12 size-[520px] rounded-full bg-[#035EF9]/18 blur-[110px]"
      />
      <motion.div
        animate={{ x: [0, -35, 0], y: [0, 28, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-32 top-20 size-[560px] rounded-full bg-[#F84D8E]/15 blur-[130px]"
      />
      <div className="absolute bottom-0 left-1/2 h-64 w-[80%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(252,116,3,0.13),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
        {heroCommerceDecor.map((item, index) => (
          <motion.div
            key={index}
            animate={{ y: [0, -10, 0], rotate: [0, 3, -2, 0] }}
            transition={{
              duration: 7 + index,
              delay: item.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute text-white/[0.055]"
            style={{ left: item.x, top: item.y }}
          >
            <item.icon style={{ width: item.size, height: item.size }} strokeWidth={1.25} />
          </motion.div>
        ))}
        {[agents[2], agents[6], agents[9]].map((agent, index) => (
          <motion.div
            key={agent.id}
            animate={{ y: [0, index % 2 ? 8 : -8, 0] }}
            transition={{ duration: 8 + index, repeat: Infinity, ease: "easeInOut" }}
            className="absolute size-16 overflow-hidden rounded-2xl opacity-[0.055] grayscale"
            style={{
              left: index === 1 ? "auto" : `${18 + index * 28}%`,
              right: index === 1 ? "7%" : "auto",
              top: `${15 + index * 30}%`,
            }}
          >
            <Image src={agent.avatar} alt="" width={64} height={64} />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-16 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left"
        >
          <motion.div variants={reveal} className="mb-7 flex justify-center lg:justify-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/70 backdrop-blur">
              <span className="size-2 rounded-full bg-[#36B46F] shadow-[0_0_14px_#36B46F]" />
              11 specialists. One Amazon listing workflow.
            </div>
          </motion.div>
          <motion.h1
            variants={reveal}
            className="text-balance text-5xl font-bold leading-[0.98] tracking-[-0.065em] text-white sm:text-7xl xl:text-[5.5rem]"
          >
            Your AI product
            <span className="sellercrew-gradient-text block pb-2">listing team.</span>
          </motion.h1>
          <motion.p
            variants={reveal}
            className="mx-auto mt-7 max-w-xl text-lg leading-8 text-white/55 lg:mx-0"
          >
            SellerCrew coordinates research, strategy, copy, SEO, compliance,
            creative direction, and QA so your team can build stronger Amazon listings
            from one focused workspace.
          </motion.p>
          <motion.div
            variants={reveal}
            className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
          >
            <Button
              size="lg"
              className="h-13 rounded-xl bg-white px-7 text-base font-semibold text-[#0B0F1A] shadow-xl shadow-white/10 hover:bg-white/90"
              onClick={() => setView("auth")}
            >
              Build your first listing
              <ArrowRight className="ml-2 size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 rounded-xl border-white/15 bg-white/[0.04] px-7 text-base text-white hover:bg-white/10 hover:text-white"
              onClick={() =>
                document.querySelector("#crew")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Meet the crew
            </Button>
          </motion.div>
          <motion.div
            variants={reveal}
            className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-white/45 lg:justify-start"
          >
            {["Structured workflow", "Amazon-focused", "Built-in review"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <Check className="size-4 text-[#36B46F]" />
                {item}
              </span>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, x: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-3xl"
        >
          <div className="absolute -inset-8 rounded-[3rem] bg-[conic-gradient(from_120deg,#035EF9,#7E44E6,#F84D8E,#FC7403,#035EF9)] opacity-25 blur-3xl" />
          <div className="relative min-h-[550px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0D1220]/90 p-4 shadow-2xl shadow-black/40 backdrop-blur sm:p-6">
            <div className="sellercrew-grid absolute inset-0 opacity-25" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(126,68,230,0.14),transparent_52%)]" />

            <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm font-semibold text-white">Crew workspace</p>
                <p className="mt-1 text-xs text-white/35">Wireless Earbuds Pro listing</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#36B46F]/20 bg-[#36B46F]/10 px-3 py-1.5 text-xs font-medium text-[#63D99A]">
                <motion.span
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="size-2 rounded-full bg-[#36B46F]"
                />
                Crew active
              </div>
            </div>

            <div className="relative z-10 mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
              {agents.map((agent, index) => (
                <motion.article
                  key={agent.id}
                  initial={{ opacity: 0, scale: 0.85, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.35 + index * 0.055, duration: 0.4 }}
                  whileHover={{ y: -4, borderColor: `${agent.color}80` }}
                  className={`relative min-w-0 rounded-2xl border border-white/8 bg-white/[0.045] p-2.5 ${
                    index === 0 ? "col-span-2 sm:col-span-2" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <motion.div
                      animate={index < 6 ? { boxShadow: [`0 0 0 ${agent.color}00`, `0 0 18px ${agent.color}55`, `0 0 0 ${agent.color}00`] } : {}}
                      transition={{ duration: 2.6, delay: index * 0.25, repeat: Infinity }}
                      className="size-10 shrink-0 overflow-hidden rounded-xl border border-white/15"
                      style={{ backgroundColor: agent.color }}
                    >
                      <Image src={agent.avatar} alt={agent.name} width={40} height={40} />
                    </motion.div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-white">{agent.name}</p>
                      <p className="mt-0.5 truncate text-[10px] text-white/35">
                        {agentStates[index]}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: "12%" }}
                      animate={{ width: index === 10 ? ["45%", "100%"] : ["18%", "82%", "35%"] }}
                      transition={{
                        duration: index === 10 ? 4 : 5.5,
                        delay: index * 0.18,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                      }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: agent.color }}
                    />
                  </div>
                </motion.article>
              ))}
            </div>

            <div className="relative z-10 mt-4 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-[#7E44E6]" />
                    <p className="text-xs font-semibold text-white">Live workflow</p>
                  </div>
                  <span className="text-[10px] text-white/30">8 of 11 tasks</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  {agents.map((agent, index) => (
                    <motion.span
                      key={agent.id}
                      animate={{ opacity: index < 8 ? [0.55, 1, 0.55] : 0.18 }}
                      transition={{ duration: 2, delay: index * 0.15, repeat: Infinity }}
                      className="h-1.5 flex-1 rounded-full"
                      style={{ backgroundColor: index < 8 ? agent.color : "#ffffff" }}
                    />
                  ))}
                </div>
                <p className="mt-3 text-[11px] leading-5 text-white/35">
                  Bayan is drafting conversion copy while Nadeem maps target keywords.
                </p>
              </div>
              <motion.div
                animate={{ borderColor: ["rgba(54,180,111,.2)", "rgba(54,180,111,.55)", "rgba(54,180,111,.2)"] }}
                transition={{ duration: 2.8, repeat: Infinity }}
                className="rounded-2xl border bg-[#36B46F]/[0.07] p-4"
              >
                <div className="flex items-center gap-2 text-[#63D99A]">
                  <PackageCheck className="size-4" />
                  <p className="text-xs font-semibold">Output assembling</p>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-white/40">
                  Title, bullets, description, SEO terms, and compliance notes.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ProductPreview() {
  const container = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [55, -35]);

  return (
    <section ref={container} id="product-preview" className="relative overflow-hidden bg-white px-5 py-24 sm:px-8 sm:py-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7E44E6]/30 to-transparent" />
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          label="Live product preview"
          title="One workspace. The whole crew."
          description="Move from product context to coordinated agent work without juggling prompts, files, and disconnected tools."
        />

        <motion.div
          style={{ y }}
          className="relative mx-auto mt-16 max-w-6xl"
        >
          <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-r from-[#035EF9]/15 via-[#7E44E6]/15 to-[#FC7403]/15 blur-3xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#0B0F1A] p-2 shadow-[0_35px_90px_-35px_rgba(11,15,26,0.45)] sm:p-3">
            <div className="flex h-9 items-center gap-2 px-3">
              <span className="size-2.5 rounded-full bg-[#E82E33]" />
              <span className="size-2.5 rounded-full bg-[#FEBD05]" />
              <span className="size-2.5 rounded-full bg-[#36B46F]" />
              <span className="ml-3 text-[11px] text-white/40">sellercrew.app/dashboard</span>
            </div>
            <Image
              src="/previews/real-dashboard-full.png"
              alt="SellerCrew dashboard"
              width={1920}
              height={1080}
              className="h-auto w-full rounded-xl"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CrewSection() {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const leadAgent = agents[0];
  const specialistAgents = agents.slice(1);

  const renderMobileAgent = (agent: (typeof agents)[number], isLead = false) => {
    const isExpanded = expandedAgent === agent.id;

    return (
      <motion.article
        key={agent.id}
        variants={reveal}
        className={`relative overflow-hidden rounded-2xl border bg-white/[0.045] backdrop-blur ${
          isLead ? "col-span-2" : ""
        } ${isExpanded ? "border-white/20" : "border-white/10"}`}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)`,
          }}
        />
        <button
          type="button"
          onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
          aria-expanded={isExpanded}
          className="flex w-full flex-col items-center gap-2.5 px-3 py-4 text-center"
        >
          <div
            className={`shrink-0 overflow-hidden rounded-xl border border-white/15 ${
              isLead ? "size-14" : "size-12"
            }`}
            style={{ backgroundColor: agent.color }}
          >
            <Image
              src={agent.avatar}
              alt=""
              width={isLead ? 56 : 48}
              height={isLead ? 56 : 48}
            />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white">{agent.name}</h3>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {isExpanded ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/8 px-4 pb-4 pt-3">
                <p className="text-xs font-medium" style={{ color: agent.color }}>
                  {agent.role}
                </p>
                <p className="mt-2 text-xs leading-5 text-white/45">
                  {agent.responsibilities.join(" · ")}
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.article>
    );
  };

  return (
    <section id="crew" className="relative overflow-hidden bg-[#0B0F1A] px-5 py-24 sm:px-8 sm:py-32">
      <div className="sellercrew-grid absolute inset-0 opacity-20" />
      <div className="absolute left-1/2 top-0 h-72 w-[720px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(126,68,230,0.22),transparent_68%)]" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          light
          label="The SellerCrew"
          title="Every specialist has a job."
          description="Ali coordinates the workflow while each agent focuses on a specific discipline required for a complete Amazon listing."
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.08 }}
          className="mt-12 grid grid-cols-2 items-start gap-3 sm:hidden"
        >
          {renderMobileAgent(leadAgent, true)}
          {specialistAgents.map((agent) => renderMobileAgent(agent))}
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          className="mt-16 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4"
        >
          {agents.map((agent, index) => (
            <motion.article
              key={agent.id}
              variants={reveal}
              whileHover={{ y: -7 }}
              className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur ${
                index === 0 ? "sm:col-span-2 lg:col-span-2" : ""
              }`}
            >
              <div
                className="absolute inset-x-0 top-0 h-px opacity-80"
                style={{
                  background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)`,
                }}
              />
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ rotate: 5, scale: 1.06 }}
                  className="size-16 shrink-0 overflow-hidden rounded-2xl border border-white/15"
                  style={{ backgroundColor: agent.color }}
                >
                  <Image src={agent.avatar} alt={agent.name} width={64} height={64} />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                    {index === 0 ? (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/60">
                        LEAD
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-white/45">{agent.role}</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-white/50">
                {agent.responsibilities.join(" · ")}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section id="workflow" className="relative bg-[#F7F8FC] px-5 py-16 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="sm:hidden">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#035EF9]">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-[1.05] tracking-[-0.05em] text-[#0B0F1A]">
            One product in.
            <span className="sellercrew-gradient-text block">One complete listing out.</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
            Four connected steps. The crew handles the work between them.
          </p>
        </div>

        <div className="hidden sm:block">
          <SectionHeading
            label="How it works"
            title="From product details to a reviewed listing."
            description="A clear sequence keeps every specialist grounded in the work that came before it."
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.45 }}
          className="relative mt-9 grid grid-cols-2 gap-3 sm:hidden"
        >
          <div className="pointer-events-none absolute left-1/2 top-8 h-[calc(100%-4rem)] w-px -translate-x-1/2 bg-gradient-to-b from-[#035EF9]/35 via-[#7E44E6]/30 to-[#FC7403]/35" />
          <div className="pointer-events-none absolute left-8 right-8 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-[#035EF9]/25 via-[#7E44E6]/30 to-[#FC7403]/25" />
          {workflow.map((step, index) => (
            <motion.article
              key={step.number}
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="relative min-h-40 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_16px_45px_-32px_rgba(11,15,26,0.45)]"
            >
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${
                    ["#035EF9", "#7E44E6", "#F84D8E", "#FC7403"][index]
                  }, transparent)`,
                }}
              />
              <span className="text-[11px] font-bold tracking-[0.18em] text-slate-300">
                {step.number}
              </span>
              <h3 className="mt-4 text-[15px] font-semibold leading-5 tracking-tight text-[#0B0F1A]">
                {step.title}
              </h3>
              <p className="mt-2 text-[11px] leading-[1.55] text-slate-500">
                {step.description}
              </p>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="relative mt-16 hidden gap-5 sm:grid lg:grid-cols-4"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.25 }}
            className="absolute left-[10%] right-[10%] top-9 hidden h-px origin-left bg-gradient-to-r from-[#035EF9] via-[#7E44E6] to-[#FC7403] lg:block"
          />
          {workflow.map((step, index) => (
            <motion.article key={step.number} variants={reveal} className="relative">
              <div className="relative z-10 flex size-18 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-bold shadow-lg shadow-slate-200/60">
                <span className="sellercrew-gradient-text">{step.number}</span>
              </div>
              <h3 className="mt-7 text-xl font-semibold tracking-tight text-[#0B0F1A]">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">{step.description}</p>
              <span className="absolute -right-2 top-4 hidden text-xs font-semibold text-slate-300 lg:block">
                {index < workflow.length - 1 ? "→" : ""}
              </span>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  return (
    <section id="capabilities" className="overflow-hidden bg-white px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-end gap-8 lg:grid-cols-2">
          <motion.div
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#035EF9]">
              Core capabilities
            </p>
            <h2 className="mt-4 max-w-xl text-4xl font-bold tracking-[-0.05em] text-[#0B0F1A] sm:text-6xl">
              Built around the listing, not a blank chat box.
            </h2>
          </motion.div>
          <motion.p
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="max-w-xl text-lg leading-8 text-slate-500 lg:justify-self-end"
          >
            Every capability belongs to the same workflow, so research informs strategy,
            strategy informs copy, and every output reaches compliance and QA.
          </motion.p>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          className="mt-16 grid gap-x-10 gap-y-4 md:grid-cols-2"
        >
          {capabilities.map((capability) => (
            <motion.article
              key={capability.title}
              variants={reveal}
              className="group flex gap-5 border-b border-slate-200 py-7"
            >
              <div
                className="relative flex size-14 shrink-0 items-center justify-center rounded-full border transition-transform duration-300 group-hover:scale-105"
                style={{
                  color: capability.color,
                  borderColor: `${capability.color}30`,
                  backgroundColor: `${capability.color}0B`,
                }}
              >
                <capability.icon className="size-6" strokeWidth={1.75} />
                <span
                  className="absolute -bottom-0.5 size-2 rounded-full ring-4 ring-white"
                  style={{ backgroundColor: capability.color }}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#0B0F1A]">{capability.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {capability.description}
                </p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function PricingSection() {
  const setView = useAppStore((state) => state.setView);
  const plans = Object.entries(SUBSCRIPTION_PLANS);

  return (
    <section id="pricing" className="relative overflow-hidden bg-[#0B0F1A] px-5 py-24 sm:px-8 sm:py-32">
      <div className="absolute -right-48 top-20 size-[520px] rounded-full bg-[#035EF9]/15 blur-[120px]" />
      <div className="absolute -left-48 bottom-0 size-[520px] rounded-full bg-[#FC7403]/10 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          light
          label="Pricing"
          title="Choose the crew capacity you need."
          description={`Every plan uses credits across agent tasks. One complete crew generation costs ${FULL_GENERATION_COST} credits.`}
        />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4"
        >
          {plans.map(([key, plan]) => {
            const featured = key === "pro";
            return (
              <motion.article
                key={key}
                variants={reveal}
                whileHover={{ y: -6 }}
                className={`relative rounded-3xl border p-6 ${
                  featured
                    ? "border-[#7E44E6]/70 bg-white text-[#0B0F1A] shadow-2xl shadow-[#7E44E6]/20"
                    : "border-white/10 bg-white/[0.045] text-white"
                }`}
              >
                {featured ? (
                  <div className="absolute -top-3 right-5 rounded-full bg-gradient-to-r from-[#035EF9] via-[#7E44E6] to-[#F84D8E] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                    Most popular
                  </div>
                ) : null}
                <p className={`text-sm font-semibold ${featured ? "text-[#035EF9]" : "text-white/55"}`}>
                  {plan.name}
                </p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-bold">{plan.price ? `$${plan.price}` : "Custom"}</span>
                  {plan.price ? (
                    <span className={featured ? "text-slate-400" : "text-white/35"}>/mo</span>
                  ) : null}
                </div>
                <p className={`mt-3 text-sm ${featured ? "text-slate-500" : "text-white/45"}`}>
                  {plan.credits === -1 ? "Unlimited credits" : `${plan.credits.toLocaleString()} credits`}
                </p>
                <ul className="mt-7 space-y-3">
                  {plan.features.slice(0, 6).map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-sm">
                      <Check className={`mt-0.5 size-4 shrink-0 ${featured ? "text-[#36B46F]" : "text-[#36B46F]"}`} />
                      <span className={featured ? "text-slate-600" : "text-white/60"}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`mt-8 w-full rounded-xl ${
                    featured
                      ? "bg-[#0B0F1A] text-white hover:bg-[#0B0F1A]/90"
                      : "bg-white text-[#0B0F1A] hover:bg-white/90"
                  }`}
                  onClick={() => setView("auth")}
                >
                  {key === "enterprise" ? "Contact sales" : "Start building"}
                </Button>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [open, setOpen] = useState(0);

  return (
    <section className="bg-white px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.75fr_1.25fr]">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#035EF9]">FAQ</p>
          <h2 className="mt-4 text-4xl font-bold tracking-[-0.05em] text-[#0B0F1A] sm:text-5xl">
            Clear answers before your crew starts.
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-500">
            SellerCrew is designed as a structured production workspace for Amazon listing teams.
          </p>
        </motion.div>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="divide-y divide-slate-200 border-y border-slate-200"
        >
          {faqs.map((item, index) => {
            const active = open === index;
            return (
              <motion.div key={item.question} variants={reveal}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-5 py-6 text-left"
                  onClick={() => setOpen(active ? -1 : index)}
                >
                  <span className="font-semibold text-[#0B0F1A]">{item.question}</span>
                  <motion.span animate={{ rotate: active ? 180 : 0 }}>
                    <ChevronDown className="size-5 text-slate-400" />
                  </motion.span>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: active ? "auto" : 0, opacity: active ? 1 : 0 }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl pb-6 text-sm leading-7 text-slate-500">{item.answer}</p>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const setView = useAppStore((state) => state.setView);

  return (
    <section className="bg-white px-5 pb-8 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.7 }}
        className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#0B0F1A] px-6 py-20 text-center sm:px-12 sm:py-24"
      >
        <div className="sellercrew-grid absolute inset-0 opacity-20" />
        <div className="absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_90deg,#035EF9,#7E44E6,#F84D8E,#FC7403,#035EF9)] opacity-20 blur-[100px]" />
        <div className="relative">
          <motion.div
            animate={{ rotate: [0, 4, -4, 0], y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto mb-7 size-20 overflow-hidden rounded-3xl border border-white/15 shadow-2xl"
          >
            <Image src="/logo2.png" alt="" width={80} height={80} />
          </motion.div>
          <h2 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-[-0.05em] text-white sm:text-6xl">
            Give every listing a complete crew.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/50 sm:text-lg">
            Bring research, copy, SEO, compliance, creative direction, and QA into one coordinated workflow.
          </p>
          <Button
            size="lg"
            className="mt-9 h-13 rounded-xl bg-white px-8 text-base font-semibold text-[#0B0F1A] hover:bg-white/90"
            onClick={() => setView("auth")}
          >
            Start building
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-white px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 border-t border-slate-200 pt-8 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <Image src="/logo2.png" alt="" width={34} height={34} className="rounded-xl" />
          <span className="text-xl font-extrabold tracking-[-0.055em] text-[#0B0F1A]">
            sellercrew
          </span>
        </div>
        <p className="text-center text-sm text-slate-400">
          Your AI product listing team.
        </p>
        <div className="flex gap-5 text-sm text-slate-500">
          <a href="#crew" className="hover:text-[#0B0F1A]">The Crew</a>
          <a href="#pricing" className="hover:text-[#0B0F1A]">Pricing</a>
          <a href="#product-preview" className="hover:text-[#0B0F1A]">Product</a>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <main className="overflow-hidden bg-white">
      <Navbar />
      <Hero />
      <ProductPreview />
      <CrewSection />
      <WorkflowSection />
      <CapabilitiesSection />
      <PricingSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}
