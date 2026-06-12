"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { agents } from "@/lib/agents";
import { AGENT_CREDITS, FULL_GENERATION_COST, SUBSCRIPTION_PLANS } from "@/lib/credits";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  Zap,
  Search,
  Shield,
  BarChart3,
  ImageIcon,
  TrendingUp,
  Check,
  X,
  Minus,
  Play,
  Bot,
  Target,
  Palette,
  CheckCircle2,
  Users,
  Building2,
  Lock,
  BarChart2,
  CreditCard,
  Globe,
  ChevronDown,
  Menu,
  XIcon,
  ArrowDown,
  Star,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

/* ───────────────────────── Animation Helpers ───────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const staggerContainerSlow = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ───────────────────────── Navbar ───────────────────────── */

function Navbar() {
  const setView = useAppStore((s) => s.setView);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Enterprise", href: "#enterprise" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0B0F1A]/80 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image src="/logo2.png" alt="SellerCrew" width={32} height={32} />
            <Image src="/logo-text.png" alt="SellerCrew" width={120} height={24} className="hidden sm:block" />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white hover:bg-white/5"
              onClick={() => setView("auth")}
            >
              Sign In
            </Button>
            <Button
              size="sm"
              className="bg-white text-[#0B0F1A] hover:bg-white/90 rounded-lg"
              onClick={() => setView("auth")}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-white/60"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <XIcon size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="md:hidden pb-4 border-t border-white/5"
          >
            <div className="flex flex-col gap-3 pt-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/60 hover:text-white transition-colors px-2 py-1"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white justify-start"
                  onClick={() => { setView("auth"); setMobileOpen(false); }}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  className="bg-white text-[#0B0F1A] hover:bg-white/90 rounded-lg"
                  onClick={() => { setView("auth"); setMobileOpen(false); }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}

/* ───────────────────────── Section 1: Hero ───────────────────────── */

function HeroSection() {
  const setView = useAppStore((s) => s.setView);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0B0F1A] pt-16">
      {/* Gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <Badge
            variant="outline"
            className="border-white/10 bg-white/5 text-white/80 px-4 py-1.5 text-sm rounded-full"
          >
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
            AI-Powered Amazon Listing Platform
          </Badge>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6"
        >
          Your AI Product{" "}
          <span className="gradient-text">Listing Team</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-base sm:text-lg md:text-xl text-white/50 max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          Stop using generic AI tools. Build Amazon-ready listings with a complete AI workforce
          specialized in research, SEO, compliance, strategy, creativity, and quality control.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Button
            size="lg"
            className="bg-white text-[#0B0F1A] hover:bg-white/90 rounded-xl px-8 h-12 text-base font-semibold"
            onClick={() => setView("auth")}
          >
            Start Free Trial
            <ArrowRight className="ml-2 size-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-white/20 text-white hover:bg-white/5 rounded-xl px-8 h-12 text-base"
          >
            <Play className="mr-2 size-4" />
            Watch Demo
          </Button>
        </motion.div>

        {/* Agent Flow Strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="relative w-full overflow-hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0B0F1A] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0B0F1A] to-transparent z-10 pointer-events-none" />

          <motion.div
            animate={{ x: [0, -1200] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-3 w-max"
          >
            {[...agents, ...agents, ...agents].map((agent, i) => {
              const isFirst = i % agents.length === 0;
              return (
                <div key={`${agent.id}-${i}`} className="flex items-center gap-3 shrink-0">
                  <div
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${
                      isFirst
                        ? "border-white/20 bg-white/10"
                        : "border-white/5 bg-white/[0.03]"
                    }`}
                  >
                    <div className="relative">
                      <Image
                        src={agent.avatar}
                        alt={agent.name}
                        width={isFirst ? 36 : 28}
                        height={isFirst ? 36 : 28}
                        className="rounded-full"
                      />
                      {isFirst && (
                        <span className="absolute -top-1.5 -right-1.5 bg-[#035EF9] text-white text-[8px] px-1 py-0.5 rounded-full font-medium leading-none">
                          Lead
                        </span>
                      )}
                    </div>
                    <div className="text-left">
                      <p className={`text-white font-medium ${isFirst ? "text-sm" : "text-xs"}`}>
                        {agent.name}
                      </p>
                      <p className="text-white/40 text-[10px] truncate max-w-[80px]">
                        {agent.role}
                      </p>
                    </div>
                  </div>
                  {i < [...agents, ...agents, ...agents].length - 1 && (
                    <ArrowRight className="size-3 text-white/15 shrink-0" />
                  )}
                </div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ArrowDown className="size-5 text-white/20" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ───────────────────────── Section 2: Dashboard Preview ───────────────────────── */

function DashboardPreviewSection() {
  const previews = [
    { title: "Project Dashboard", image: "/previews/dashboard.png" },
    { title: "Agent Workflow", image: "/previews/workflow.png" },
    { title: "Listing Generator", image: "/previews/generator.png" },
  ];

  const pills = ["Research Reports", "SEO Analysis", "Compliance Reports"];

  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B0F1A] tracking-tight mb-4">
            See SellerCrew in Action
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            A complete workspace designed for Amazon listing professionals.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
        >
          {previews.map((preview) => (
            <motion.div key={preview.title} variants={fadeUp}>
              <Card className="overflow-hidden border border-gray-200/80 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 py-0 gap-0">
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  <Image
                    src={preview.image}
                    alt={preview.title}
                    width={600}
                    height={340}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="p-4 border-t border-gray-100">
                  <p className="text-sm font-semibold text-[#0B0F1A]">{preview.title}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {pills.map((pill) => (
            <motion.div key={pill} variants={fadeUp}>
              <Badge
                variant="secondary"
                className="px-4 py-2 text-sm rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                {pill}
              </Badge>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────── Section 3: Social Proof ───────────────────────── */

function SocialProofSection() {
  const metrics = [
    { value: "10,000+", label: "Listings Generated" },
    { value: "98%", label: "Compliance Accuracy" },
    { value: "35%", label: "Average Listing Improvement" },
    { value: "24/7", label: "AI Workforce" },
  ];

  const logos = ["TechCo", "SellerPro", "MarketFlow", "BrandLabs", "CommerceAI", "RetailEdge"];

  return (
    <section className="py-24 sm:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B0F1A] tracking-tight mb-4">
            Trusted by Amazon Sellers Worldwide
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {metrics.map((metric) => (
            <motion.div key={metric.label} variants={fadeUp}>
              <Card className="text-center p-6 border-gray-200/60 bg-white py-8">
                <p className="text-3xl sm:text-4xl font-bold text-[#0B0F1A] mb-2">{metric.value}</p>
                <p className="text-sm text-gray-500">{metric.label}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Logos */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-8 sm:gap-12"
        >
          {logos.map((logo) => (
            <div
              key={logo}
              className="text-gray-300 font-semibold text-lg tracking-wide select-none"
            >
              {logo}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────── Section 4: Problem ───────────────────────── */

function ProblemSection() {
  const withoutItems = [
    "Random ChatGPT prompts",
    "Inconsistent listing quality",
    "Missing critical keywords",
    "Compliance risks and violations",
    "No quality assurance process",
    "One AI does everything poorly",
  ];

  const withItems = [
    "Structured multi-agent workflow",
    "Specialist agents for each task",
    "Built-in review system",
    "Automated compliance validation",
    "End-to-end quality control",
    "11 experts working together",
  ];

  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B0F1A] tracking-tight mb-4">
            The Problem with Generic AI Tools
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Without */}
          <motion.div
            variants={staggerContainerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="rounded-2xl border border-red-100 bg-red-50/50 p-8"
          >
            <h3 className="text-lg font-semibold text-red-700 mb-6">Without SellerCrew</h3>
            <div className="space-y-4">
              {withoutItems.map((item) => (
                <motion.div
                  key={item}
                  variants={fadeUp}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="size-3 text-red-500" />
                  </div>
                  <p className="text-sm text-red-800/80">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* With */}
          <motion.div
            variants={staggerContainerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="rounded-2xl border border-green-100 bg-green-50/50 p-8"
          >
            <h3 className="text-lg font-semibold text-green-700 mb-6">With SellerCrew</h3>
            <div className="space-y-4">
              {withItems.map((item) => (
                <motion.div
                  key={item}
                  variants={fadeUp}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="size-3 text-green-600" />
                  </div>
                  <p className="text-sm text-green-800/80">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Section 5: How It Works ───────────────────────── */

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B0F1A] tracking-tight mb-4">
            How SellerCrew Works
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            11 specialized agents work in sequence, each building on the previous agent&apos;s output.
          </p>
        </motion.div>

        {/* Pipeline */}
        <motion.div
          variants={staggerContainerSlow}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-col items-center"
        >
          {agents.map((agent, idx) => (
            <div key={agent.id} className="flex flex-col items-center w-full">
              <motion.div
                variants={fadeUp}
                className="w-full bg-white rounded-xl border border-gray-200/80 p-4 flex items-center gap-4 shadow-sm"
              >
                <div
                  className="w-1 h-12 rounded-full shrink-0"
                  style={{ backgroundColor: agent.color === "#FDFDFD" ? "#035EF9" : agent.color }}
                />
                <Image
                  src={agent.avatar}
                  alt={agent.name}
                  width={36}
                  height={36}
                  className="rounded-full shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-[#0B0F1A] text-sm">{agent.name}</p>
                  <p className="text-xs text-gray-500 truncate">{agent.role}</p>
                </div>
              </motion.div>
              {idx < agents.length - 1 && (
                <div className="flex flex-col items-center py-1">
                  <div className="w-px h-6 bg-gray-300" />
                  <ArrowDown className="size-4 text-gray-300 -mt-1" />
                </div>
              )}
            </div>
          ))}

          {/* Final Listing */}
          <div className="flex flex-col items-center pt-2">
            <div className="w-px h-6 bg-gray-300" />
            <ArrowDown className="size-4 text-gray-300 -mt-1" />
          </div>
          <motion.div
            variants={fadeUp}
            className="w-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-orange-500/10 rounded-xl border-2 border-dashed border-blue-200 p-5 flex items-center justify-center gap-3 mt-1"
          >
            <CheckCircle2 className="size-6 text-green-500" />
            <div>
              <p className="font-bold text-[#0B0F1A]">Final Listing</p>
              <p className="text-xs text-gray-500">Ready for Amazon</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────── Section 6: Meet The Crew ───────────────────────── */

function MeetTheCrewSection() {
  const ali = agents[0];
  const crew = agents.slice(1);

  const descriptions: Record<string, string> = {
    raed: "Deep product research and market discovery. Analyzes products, identifies key features, and gathers competitive context.",
    fares: "Market intelligence and competitor analysis. Identifies keyword opportunities, tracks trends, and maps demand signals.",
    noor: "Visual analysis and image recommendations. Analyzes product images, identifies improvements, and suggests creative directions.",
    hakim: "Listing strategy and SEO structure. Designs listing architecture, defines positioning, and builds conversion strategy.",
    saleem: "Amazon policy compliance. Validates every claim, checks against policies, and flags risks before publication.",
    bayan: "Compelling listing copy. Writes titles, bullets, descriptions, and A+ content optimized for both algorithm and buyers.",
    nadeem: "Amazon SEO optimization. Maps search intent, optimizes keywords, and ensures maximum discoverability on Amazon.",
    rayan: "Creative direction for visuals. Develops image concepts, infographic briefs, and lifestyle shot directions.",
    adam: "AI prompt engineering. Crafts optimized prompts for image generation, A+ content, and specialized AI outputs.",
    badr: "Quality assurance and validation. Reviews all output for consistency, accuracy, and compliance before final delivery.",
  };

  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B0F1A] tracking-tight mb-4">
            Meet The Crew
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            11 specialized AI agents, each an expert in their domain, working together to create
            perfect Amazon listings.
          </p>
        </motion.div>

        {/* Ali - Featured */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-md mx-auto mb-16"
        >
          <Card className="overflow-hidden border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow py-0 gap-0">
            <div className="bg-gradient-to-br from-[#035EF9]/5 to-purple-500/5 p-8 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Image
                  src={ali.avatar}
                  alt={ali.name}
                  width={72}
                  height={72}
                  className="rounded-full border-2 border-white shadow-sm"
                />
                <Badge className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#035EF9] text-white text-[10px] px-2 py-0.5 rounded-full border-0 whitespace-nowrap">
                  Team Leader
                </Badge>
              </div>
              <h3 className="text-xl font-bold text-[#0B0F1A] mb-1">{ali.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{ali.role}</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Coordinates the entire team, routes tasks, and ensures every agent contributes at
                the right time.
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Crew Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          {crew.map((agent) => (
            <motion.div
              key={agent.id}
              variants={fadeUp}
              className="group"
            >
              <Card className="h-full border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 py-0 gap-0 overflow-hidden">
                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: agent.color === "#FDFDFD" ? "#035EF9" : agent.color }}
                />
                <div className="p-4 flex flex-col items-center text-center">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${agent.color === "#FDFDFD" ? "#035EF9" : agent.color}15` }}
                  >
                    <Image
                      src={agent.avatar}
                      alt={agent.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  </div>
                  <h4 className="font-semibold text-[#0B0F1A] text-sm mb-0.5">{agent.name}</h4>
                  <p className="text-xs text-gray-500 mb-2">{agent.role}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {descriptions[agent.id]}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────── Section 7: Features ───────────────────────── */

function FeaturesSection() {
  const setView = useAppStore((s) => s.setView);

  const features = [
    {
      title: "Specialized AI Workforce",
      description: "11 agents, each a specialist. Not one AI doing everything — a team of experts.",
      icon: Bot,
      color: "#035EF9",
    },
    {
      title: "Amazon Compliance Engine",
      description: "Real-time policy validation ensures your listings never get flagged or suppressed.",
      icon: Shield,
      color: "#E82E33",
    },
    {
      title: "Advanced Keyword Intelligence",
      description: "Discover high-converting keywords with search volume and competitor mapping.",
      icon: Search,
      color: "#3EC9D1",
    },
    {
      title: "Market Research",
      description: "Deep competitor analysis, pricing intelligence, and market positioning insights.",
      icon: TrendingUp,
      color: "#36B46F",
    },
    {
      title: "Image Analysis",
      description: "AI-powered image evaluation with improvement recommendations and creative briefs.",
      icon: ImageIcon,
      color: "#7E44E6",
    },
    {
      title: "Listing Strategy",
      description: "Data-driven listing architecture designed for maximum conversion and visibility.",
      icon: Target,
      color: "#FC7403",
    },
    {
      title: "Creative Direction",
      description: "Professional image concepts, infographic briefs, and lifestyle shot directions.",
      icon: Palette,
      color: "#F84D8E",
    },
    {
      title: "Quality Assurance",
      description: "Multi-stage QA review ensures every listing meets the highest standards.",
      icon: CheckCircle2,
      color: "#60697A",
    },
  ];

  return (
    <section id="features" className="py-24 sm:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B0F1A] tracking-tight mb-4">
            Built for Serious Amazon Sellers
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Every feature designed to give you an unfair advantage.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={fadeUp}>
              <Card className="h-full border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 p-6 gap-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${feature.color}12` }}
                >
                  <feature.icon className="size-5" style={{ color: feature.color }} />
                </div>
                <h3 className="font-semibold text-[#0B0F1A] mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────── Section 8: Comparison ───────────────────────── */

function ComparisonSection() {
  const rows = [
    { feature: "Specialized Agents", sellercrew: "✓ 11 agents", chatgpt: "✗ Single AI", fiverr: "~ Varies" },
    { feature: "Amazon Compliance", sellercrew: "✓ Built-in", chatgpt: "✗ Manual", fiverr: "~ Maybe" },
    { feature: "SEO Optimization", sellercrew: "✓ Automated", chatgpt: "✗ Manual", fiverr: "~ Basic" },
    { feature: "Quality Assurance", sellercrew: "✓ Multi-stage", chatgpt: "✗ None", fiverr: "✗ None" },
    { feature: "Consistent Quality", sellercrew: "✓ Always", chatgpt: "✗ Varies", fiverr: "✗ Varies" },
    { feature: "Speed", sellercrew: "✓ Minutes", chatgpt: "~ Hours", fiverr: "✗ Days" },
    { feature: "Cost per Listing", sellercrew: "✓ ~$0.79", chatgpt: "~ $0.50 low quality", fiverr: "✗ $50-200" },
    { feature: "Scalability", sellercrew: "✓ Unlimited", chatgpt: "~ Limited", fiverr: "✗ Limited" },
  ];

  const getCellStyle = (value: string) => {
    if (value.startsWith("✓")) return "text-green-600";
    if (value.startsWith("✗")) return "text-red-400";
    return "text-amber-500";
  };

  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B0F1A] tracking-tight mb-4">
            How SellerCrew Compares
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            See why serious sellers choose SellerCrew over alternatives.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="overflow-x-auto"
        >
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-500">Feature</th>
                <th className="text-center py-4 px-4 text-sm font-semibold text-[#035EF9] bg-blue-50/50 rounded-t-lg">
                  SellerCrew
                </th>
                <th className="text-center py-4 px-4 text-sm font-semibold text-gray-500">ChatGPT</th>
                <th className="text-center py-4 px-4 text-sm font-semibold text-gray-500">Fiverr</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <motion.tr
                  key={row.feature}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <td className="py-3.5 px-4 text-sm font-medium text-[#0B0F1A]">{row.feature}</td>
                  <td className="py-3.5 px-4 text-sm text-center bg-blue-50/30 font-medium">
                    <span className={getCellStyle(row.sellercrew)}>{row.sellercrew}</span>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-center">
                    <span className={getCellStyle(row.chatgpt)}>{row.chatgpt}</span>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-center">
                    <span className={getCellStyle(row.fiverr)}>{row.fiverr}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────── Section 9: Enterprise ───────────────────────── */

function EnterpriseSection() {
  const features = [
    {
      icon: Building2,
      title: "Team Workspaces",
      description: "Isolated environments for each team or brand.",
    },
    {
      icon: Lock,
      title: "Role-Based Permissions",
      description: "Owner, Admin, Manager, Member, Viewer roles.",
    },
    {
      icon: BarChart2,
      title: "Project Management",
      description: "Organize listings by product, marketplace, or brand.",
    },
    {
      icon: CreditCard,
      title: "Usage Tracking",
      description: "Real-time credit usage and agent performance metrics.",
    },
    {
      icon: Globe,
      title: "Analytics Dashboard",
      description: "Track listing performance and team productivity.",
    },
    {
      icon: Users,
      title: "Multi-User Collaboration",
      description: "Work together on listings in real-time.",
    },
  ];

  return (
    <section id="enterprise" className="relative py-24 sm:py-32 bg-[#0B0F1A] overflow-hidden">
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Enterprise-Ready
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Built for teams that need scale, security, and control.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <feature.icon className="size-5 text-white/60" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────── Section 10: Pricing ───────────────────────── */

function PricingSection() {
  const setView = useAppStore((s) => s.setView);
  const [showCredits, setShowCredits] = useState(false);

  const plans = [
    {
      ...SUBSCRIPTION_PLANS.starter,
      priceDisplay: "$29",
      cta: "Start Free Trial",
      highlight: false,
      badge: undefined as string | undefined,
    },
    {
      ...SUBSCRIPTION_PLANS.pro,
      priceDisplay: "$79",
      cta: "Start Free Trial",
      highlight: true,
      badge: "Most Popular" as string | undefined,
    },
    {
      ...SUBSCRIPTION_PLANS.agency,
      priceDisplay: "$199",
      cta: "Start Free Trial",
      highlight: false,
      badge: undefined as string | undefined,
    },
    {
      ...SUBSCRIPTION_PLANS.enterprise,
      priceDisplay: "Custom",
      cta: "Contact Sales",
      highlight: false,
      badge: undefined as string | undefined,
    },
  ];

  return (
    <section id="pricing" className="py-24 sm:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B0F1A] tracking-tight mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Start free. Scale as you grow.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {plans.map((plan) => (
            <motion.div key={plan.name} variants={fadeUp}>
              <Card
                className={`h-full flex flex-col p-6 gap-0 py-0 relative ${
                  plan.highlight
                    ? "border-[#035EF9] border-2 shadow-lg shadow-blue-500/10"
                    : "border-gray-200/80"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#035EF9] text-white border-0 px-3 py-0.5 text-xs">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <div className="pt-6 pb-4">
                  <p className="text-sm font-semibold text-gray-500 mb-1">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-bold text-[#0B0F1A]">{plan.priceDisplay}</span>
                    {plan.priceDisplay !== "Custom" && (
                      <span className="text-sm text-gray-400">/mo</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {plan.listings === -1
                      ? "Unlimited listings"
                      : `${plan.listings} Listings`}{" "}
                    · {plan.credits === -1 ? "Unlimited" : plan.credits.toLocaleString()} Credits ·{" "}
                    {plan.users === -1 ? "Unlimited" : plan.users} User{plan.users !== 1 && plan.users !== -1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex-1 border-t border-gray-100 pt-4 pb-2">
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="size-4 text-green-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-4 pb-6">
                  <Button
                    className={`w-full rounded-xl h-10 ${
                      plan.highlight
                        ? "bg-[#035EF9] text-white hover:bg-[#035EF9]/90"
                        : plan.name === "Enterprise"
                        ? "bg-[#0B0F1A] text-white hover:bg-[#0B0F1A]/90"
                        : "bg-[#0B0F1A] text-white hover:bg-[#0B0F1A]/90"
                    }`}
                    onClick={() => setView("auth")}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Credit note */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm text-gray-400 mb-3">
            Full generation costs <span className="font-semibold text-gray-600">{FULL_GENERATION_COST} credits</span>
          </p>
          <button
            onClick={() => setShowCredits(!showCredits)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1"
          >
            View credit cost per agent
            <ChevronDown className={`size-3 transition-transform ${showCredits ? "rotate-180" : ""}`} />
          </button>
          {showCredits && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 max-w-md mx-auto bg-gray-50 rounded-xl p-4"
            >
              <div className="grid grid-cols-2 gap-2 text-xs">
                {agents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between px-2 py-1">
                    <span className="text-gray-600">{agent.name}</span>
                    <span className="font-medium text-gray-800">
                      {AGENT_CREDITS[agent.id]} credits
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────── Section 11: FAQ ───────────────────────── */

function FAQSection() {
  const faqs = [
    {
      q: "What makes SellerCrew different from ChatGPT?",
      a: "ChatGPT is a general-purpose AI. SellerCrew is a specialized AI workforce with 11 agents, each trained for a specific Amazon listing task. This means better quality, compliance, and consistency.",
    },
    {
      q: "How does the credit system work?",
      a: "Each AI agent has a specific credit cost (5-15 credits). A full listing generation uses 95 credits total. Your plan determines how many credits you receive monthly.",
    },
    {
      q: "How accurate is the compliance checking?",
      a: "Our compliance agent Saleem validates listings against the latest Amazon policies with 98%+ accuracy. We continuously update our compliance engine as Amazon policies change.",
    },
    {
      q: "What AI models power SellerCrew?",
      a: "SellerCrew uses a combination of GPT-4, Claude, and specialized fine-tuned models. Each agent uses the model best suited for its specific task.",
    },
    {
      q: "Can I customize the AI agents?",
      a: "Enterprise plan users can request custom agent training and specialized workflows tailored to their brand voice, product categories, and marketplace requirements.",
    },
    {
      q: "Is there an API available?",
      a: "Yes, our Agency and Enterprise plans include API access. You can integrate SellerCrew's AI workforce directly into your existing tools and workflows.",
    },
    {
      q: "How secure is my data?",
      a: "We use enterprise-grade encryption at rest and in transit. Your data is never used to train our models. Each organization's data is completely isolated.",
    },
    {
      q: "Do credits roll over?",
      a: "No, credits reset monthly on your billing date. This ensures you always have fresh credits available and can plan your usage effectively.",
    },
    {
      q: "Can I use SellerCrew for multiple Amazon marketplaces?",
      a: "Yes! SellerCrew supports Amazon US, UK, DE, FR, IT, ES, JP, and more. Each project can target a specific marketplace with agents adapting their output accordingly.",
    },
    {
      q: "What happens if an agent produces poor output?",
      a: "Every generation goes through Badr (QA agent) for quality review. If quality doesn't meet standards, you can regenerate specific agent outputs without running the entire pipeline again.",
    },
    {
      q: "How does the multi-agent workflow work?",
      a: "Ali (Chief Commander) coordinates the entire process. Agents run in sequence — each building on the previous agent's output. This ensures coherence and quality at every step.",
    },
    {
      q: "Can I cancel my subscription anytime?",
      a: "Absolutely. You can cancel anytime from your billing settings. Your access continues until the end of your current billing period.",
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B0F1A] tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Everything you need to know about SellerCrew.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`}>
                <AccordionTrigger className="text-left text-sm font-medium text-[#0B0F1A] hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-500 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────── Section 12: Final CTA ───────────────────────── */

function FinalCTASection() {
  const setView = useAppStore((s) => s.setView);

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F1A] to-[#1a1f33]" />

      {/* Floating agent avatars */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        {agents.map((agent, idx) => (
          <motion.div
            key={agent.id}
            className="absolute"
            initial={{
              x: `${10 + (idx * 8) % 80}%`,
              y: `${10 + (idx * 12) % 70}%`,
            }}
            animate={{
              y: [`${10 + (idx * 12) % 70}%`, `${15 + (idx * 12) % 70}%`, `${10 + (idx * 12) % 70}%`],
            }}
            transition={{ duration: 4 + idx, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src={agent.avatar}
              alt=""
              width={32}
              height={32}
              className="rounded-full"
            />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
            Ready to Build Better Amazon Listings?
          </h2>
          <p className="text-lg text-white/50 mb-10 max-w-2xl mx-auto">
            Let your AI workforce handle research, SEO, compliance, strategy, creativity, and
            quality control.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-[#0B0F1A] hover:bg-white/90 rounded-xl px-8 h-12 text-base font-semibold"
              onClick={() => setView("auth")}
            >
              Start Free Trial
              <ArrowRight className="ml-2 size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/20 text-white hover:bg-white/5 rounded-xl px-8 h-12 text-base"
            >
              Book Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────── Section 13: Footer ───────────────────────── */

function Footer() {
  const columns = [
    {
      title: "Product",
      links: ["Listing Builder", "Keyword Center", "Competitor Analyzer", "Image Briefs", "Compliance Engine"],
    },
    {
      title: "Resources",
      links: ["Blog", "Documentation", "API Reference", "Changelog", "Status"],
    },
    {
      title: "Company",
      links: ["About", "Careers", "Press", "Contact", "Partners"],
    },
    {
      title: "Legal",
      links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"],
    },
  ];

  return (
    <footer className="bg-[#0B0F1A] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image src="/logo2.png" alt="SellerCrew" width={28} height={28} />
              <Image src="/logo-text.png" alt="SellerCrew" width={100} height={20} />
            </div>
            <p className="text-sm text-white/30 leading-relaxed">
              AI-powered Amazon listing platform built by a team of specialized agents.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white/70 mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-white/30 hover:text-white/60 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} SellerCrew. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-white/20 hover:text-white/50 transition-colors">
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#" className="text-white/20 hover:text-white/50 transition-colors">
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a href="#" className="text-white/20 hover:text-white/50 transition-colors">
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ───────────────────────── Main Export ───────────────────────── */

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <DashboardPreviewSection />
      <SocialProofSection />
      <ProblemSection />
      <HowItWorksSection />
      <MeetTheCrewSection />
      <FeaturesSection />
      <ComparisonSection />
      <EnterpriseSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
}
