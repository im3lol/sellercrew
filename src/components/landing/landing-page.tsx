"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { agents } from "@/lib/agents";
import { Button } from "@/components/ui/button";
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
  Image,
  TrendingUp,
  ChevronDown,
  Check,
  Star,
  Upload,
  Users,
  ArrowRightLeft,
  Download,
  Play,
} from "lucide-react";
import { useState } from "react";

function HeroSection() {
  const setView = useAppStore((s) => s.setView);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0B0F1A]">
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl" />
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

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-white/70">AI-Powered Amazon Listing Platform</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
            Your AI Product
            <br />
            <span className="gradient-text">Listing Team</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Instead of a single generic AI, work with a complete virtual product listing team.
            Every agent owns a specific responsibility — from research to compliance.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-[#0B0F1A] hover:bg-white/90 px-8 h-12 text-base font-semibold rounded-lg"
              onClick={() => setView("dashboard")}
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5 px-8 h-12 text-base rounded-lg"
            >
              Watch Demo
            </Button>
          </div>
        </motion.div>

        {/* Floating agent avatars */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 flex items-center justify-center gap-2 flex-wrap"
        >
          {agents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className="relative group"
            >
              <div
                className="w-12 h-12 rounded-xl overflow-hidden border-2 transition-transform hover:scale-110 hover:-translate-y-1"
                style={{ borderColor: agent.color + "80" }}
              >
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <span className="text-xs text-white/80 bg-black/80 px-2 py-1 rounded">
                  {agent.name}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <ChevronDown className="h-6 w-6 text-white/30" />
      </motion.div>
    </section>
  );
}

function AgentCard({ agent }: { agent: typeof agents[0] }) {
  return (
    <div className="group cursor-pointer rounded-2xl bg-white p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div
        className="mx-auto w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl overflow-hidden transition-transform duration-300 group-hover:scale-105"
        style={{ backgroundColor: agent.color }}
      >
        <img
          src={agent.avatar}
          alt={agent.name}
          className="w-full h-full object-cover"
        />
      </div>
      <h3 className="font-bold text-[#0B0F1A] text-sm sm:text-base mt-3">{agent.name}</h3>
      <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 leading-snug">{agent.role}</p>
    </div>
  );
}

function AgentShowcase() {
  const ali = agents[0];
  const team = agents.slice(1);

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0B0F1A] mb-4">
            Meet The Crew
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
            11 specialized agents, each an expert in their domain, working together to create
            perfect Amazon listings.
          </p>
        </motion.div>

        <div className="flex flex-col items-center gap-8 sm:gap-10">
          {/* Ali - Chief Commander, no border/card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            className="text-center"
          >
            <div
              className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden"
              style={{ backgroundColor: ali.color }}
            >
              <img
                src={ali.avatar}
                alt={ali.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-bold text-[#0B0F1A] text-lg sm:text-xl mt-4">{ali.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{ali.role}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-[#0B0F1A] rounded-full">
              <span className="text-xs text-white font-semibold">Team Leader</span>
            </div>
          </motion.div>

          {/* Team: 2 per row mobile, 5 per row desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 w-full"
          >
            {team.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Zap,
    title: "AI Listing Creation",
    description: "Generate complete Amazon listings with titles, bullets, descriptions, and A+ content in minutes.",
    color: "#035EF9",
  },
  {
    icon: Search,
    title: "Keyword Research",
    description: "Discover high-converting keywords with search volume analysis and competitor keyword mapping.",
    color: "#36B46F",
  },
  {
    icon: Shield,
    title: "Compliance Validation",
    description: "Ensure every listing meets Amazon's policies with automated compliance checking and risk detection.",
    color: "#E82E33",
  },
  {
    icon: BarChart3,
    title: "Competitor Analysis",
    description: "Analyze competitor listings, pricing strategies, and market positioning to gain competitive advantage.",
    color: "#7E44E6",
  },
  {
    icon: Image,
    title: "Image Brief Generation",
    description: "Create detailed image briefs for lifestyle shots, infographics, hero images, and packaging designs.",
    color: "#FC7403",
  },
  {
    icon: TrendingUp,
    title: "SEO Optimization",
    description: "Optimize listings for Amazon's A9 algorithm with keyword placement and search intent mapping.",
    color: "#3EC9D1",
  },
];

function FeaturesSection() {
  return (
    <section className="py-24 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B0F1A] mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            A complete toolkit for Amazon sellers, powered by specialized AI agents.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow"
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: feature.color + "15" }}
              >
                <feature.icon className="h-6 w-6" style={{ color: feature.color }} />
              </div>
              <h3 className="font-semibold text-[#0B0F1A] text-lg mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const workflowSteps = [
  { step: "01", title: "Upload Product", description: "Enter your product details, images, and any existing listing information." },
  { step: "02", title: "AI Team Analysis", description: "Our 11 specialized agents analyze your product, market, and competitors." },
  { step: "03", title: "Review Results", description: "Review generated content, keyword strategies, and compliance reports." },
  { step: "04", title: "Export Listing", description: "Export your Amazon-ready listing in multiple formats." },
];

function WorkflowSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B0F1A] mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-500">
            From product details to Amazon-ready listing in four simple steps.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {workflowSteps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="text-5xl font-bold text-gray-100 mb-4">{step.step}</div>
              <h3 className="font-semibold text-[#0B0F1A] text-lg mb-2">{step.title}</h3>
              <p className="text-gray-500 text-sm">{step.description}</p>
              {i < 3 && (
                <ArrowRight className="hidden lg:block absolute top-8 -right-4 h-5 w-5 text-gray-300" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const pricingPlans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "10 Listings, 500 Credits, 1 User",
    features: ["10 Listings/month", "500 Credits", "1 User Seat", "Keyword Research", "Basic Compliance", "Email Support"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/month",
    description: "100 Listings, 5,000 Credits, 5 Users",
    features: [
      "100 Listings/month",
      "5,000 Credits",
      "5 User Seats",
      "Advanced Keyword Research",
      "Full Compliance Suite",
      "Competitor Analysis",
      "Image Briefs",
      "Priority Support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Agency",
    price: "$199",
    period: "/month",
    description: "500 Listings, 25,000 Credits, 20 Users",
    features: [
      "500 Listings/month",
      "25,000 Credits",
      "20 User Seats",
      "All Research Tools",
      "Full Compliance Suite",
      "Competitor Intelligence",
      "Image Briefs",
      "API Access",
      "Dedicated Support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Unlimited Everything",
    features: [
      "Unlimited Listings",
      "Unlimited Credits",
      "Unlimited Users",
      "Custom Agent Training",
      "Multi-Marketplace",
      "SLA Guarantee",
      "Custom Integrations",
      "On-premise Option",
    ],
    cta: "Talk to Us",
    popular: false,
  },
];

function PricingSection() {
  const setView = useAppStore((s) => s.setView);

  return (
    <section className="py-24 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B0F1A] mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-500">
            Choose the plan that fits your selling volume.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricingPlans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-xl border p-6 ${
                plan.popular
                  ? "border-[#035EF9] bg-white shadow-lg"
                  : "border-gray-200 bg-white"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-[#035EF9] text-white text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="font-semibold text-[#0B0F1A] text-lg">{plan.name}</h3>
              <div className="mt-4 mb-2">
                <span className="text-4xl font-bold text-[#0B0F1A]">{plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>
              <p className="text-sm text-gray-500 mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full ${
                  plan.popular
                    ? "bg-[#035EF9] hover:bg-[#035EF9]/90 text-white"
                    : "bg-[#0B0F1A] hover:bg-[#0B0F1A]/90 text-white"
                }`}
                onClick={() => setView("dashboard")}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   NEW SECTION: HowItWorks
   ────────────────────────────────────────────── */

const howItWorksSteps = [
  {
    number: 1,
    icon: Upload,
    title: "Upload Product",
    description: "Enter your product details and our AI team gets to work immediately.",
    color: "#035EF9",
  },
  {
    number: 2,
    icon: Users,
    title: "AI Team Analysis",
    description: "11 specialized agents analyze every aspect of your product and market.",
    color: "#36B46F",
  },
  {
    number: 3,
    icon: ArrowRightLeft,
    title: "Agent Pipeline",
    description: "Each agent contributes their expertise in sequence, building on previous insights.",
    color: "#FC7403",
  },
  {
    number: 4,
    icon: Download,
    title: "Export Listing",
    description: "Get a complete, optimized Amazon listing ready to publish.",
    color: "#7E44E6",
  },
];

function HowItWorksSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B0F1A] mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            From product details to Amazon-ready listing in four simple steps.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {howItWorksSteps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center hover:shadow-lg transition-shadow h-full">
                {/* Step number circle */}
                <div className="flex items-center justify-center mb-5">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md"
                    style={{ backgroundColor: step.color }}
                  >
                    {step.number}
                  </div>
                </div>

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: step.color + "15" }}
                >
                  <step.icon className="h-5 w-5" style={{ color: step.color }} />
                </div>

                {/* Title & Description */}
                <h3 className="font-semibold text-[#0B0F1A] text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>

              {/* Connecting arrow between cards (desktop only) */}
              {i < 3 && (
                <div className="hidden lg:flex absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                  <ArrowRight className="h-5 w-5 text-gray-300" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   NEW SECTION: FAQ
   ────────────────────────────────────────────── */

const faqItems = [
  {
    question: "What makes SellerCrew different from other AI listing tools?",
    answer:
      "Unlike generic AI tools that give you one-size-fits-all output, SellerCrew uses 11 specialized AI agents, each an expert in their domain. From product research to compliance checking, every aspect of your listing is handled by a dedicated specialist.",
  },
  {
    question: "How does the credit system work?",
    answer:
      "Each AI agent has a specific credit cost. A full listing generation uses 95 credits total. Your plan determines how many credits you receive monthly. Unused credits do not roll over.",
  },
  {
    question: "Can I use SellerCrew for multiple marketplaces?",
    answer:
      "Yes! SellerCrew supports Amazon US, UK, DE, and more. Each project can target a specific marketplace and country, with agents adapting their output accordingly.",
  },
  {
    question: "How accurate is the compliance checking?",
    answer:
      "Our compliance agent Saleem validates listings against the latest Amazon policies with 98%+ accuracy. Regular updates ensure alignment with policy changes.",
  },
  {
    question: "Can I customize the AI agents?",
    answer:
      "Enterprise plan users can request custom agent training and specialized workflows tailored to their brand voice and product categories.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We use enterprise-grade encryption, and your data is never used to train our models. Each organization's data is completely isolated.",
  },
];

function FAQSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B0F1A] mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-500">
            Everything you need to know about SellerCrew.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border-gray-200"
              >
                <AccordionTrigger className="text-left text-base font-medium text-[#0B0F1A] hover:no-underline hover:text-[#0B0F1A]/80 py-5">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-500 leading-relaxed text-sm">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────
   NEW SECTION: CTA
   ────────────────────────────────────────────── */

function CTASection() {
  const setView = useAppStore((s) => s.setView);

  return (
    <section className="relative py-24 overflow-hidden bg-[#0B0F1A]">
      {/* Background gradient accents */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      {/* Floating agent avatars (decorative) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {agents.slice(0, 6).map((agent, i) => {
          const positions = [
            { top: "10%", left: "8%" },
            { top: "20%", right: "12%" },
            { bottom: "15%", left: "15%" },
            { bottom: "25%", right: "8%" },
            { top: "40%", left: "5%" },
            { top: "35%", right: "5%" },
          ];
          const pos = positions[i];
          const style: React.CSSProperties = {
            position: "absolute",
            opacity: 0.15,
            ...pos,
          };
          return (
            <motion.div
              key={agent.id}
              style={style}
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 + i * 0.5, ease: "easeInOut" }}
            >
              <div
                className="w-14 h-14 rounded-xl overflow-hidden"
                style={{ backgroundColor: agent.color }}
              >
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to Transform Your
            <br />
            Amazon Listings?
          </h2>
          <p className="text-lg text-white/60 max-w-xl mx-auto mb-10 leading-relaxed">
            Join thousands of sellers who use SellerCrew&apos;s AI team to create better listings, faster.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-[#0B0F1A] hover:bg-white/90 px-8 h-12 text-base font-semibold rounded-lg"
              onClick={() => setView("dashboard")}
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5 px-8 h-12 text-base rounded-lg"
            >
              <Play className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#0B0F1A] text-white/60 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <img src="/logo2.png" alt="SellerCrew" className="w-full h-full object-cover" />
              </div>
              <img src="/logo-text.png" alt="SellerCrew" className="h-6 object-contain" />
            </div>
            <p className="text-sm leading-relaxed">
              Your AI Product Listing Team. Specialized agents working together to create
              perfect Amazon listings.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li className="hover:text-white cursor-pointer transition-colors">Listing Builder</li>
              <li className="hover:text-white cursor-pointer transition-colors">Keyword Center</li>
              <li className="hover:text-white cursor-pointer transition-colors">Competitor Analyzer</li>
              <li className="hover:text-white cursor-pointer transition-colors">Image Briefs</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li className="hover:text-white cursor-pointer transition-colors">About Us</li>
              <li className="hover:text-white cursor-pointer transition-colors">Blog</li>
              <li className="hover:text-white cursor-pointer transition-colors">Careers</li>
              <li className="hover:text-white cursor-pointer transition-colors">Contact</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
              <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
              <li className="hover:text-white cursor-pointer transition-colors">Cookie Policy</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 text-center text-sm">
          &copy; {new Date().getFullYear()} SellerCrew. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function Navbar() {
  const setView = useAppStore((s) => s.setView);
  const [scrolled, setScrolled] = useState(false);

  useState(() => {
    if (typeof window !== "undefined") {
      const handleScroll = () => setScrolled(window.scrollY > 50);
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  });

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all ${
        scrolled ? "bg-[#0B0F1A]/95 backdrop-blur-md border-b border-white/10" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <img src="/logo2.png" alt="SellerCrew" className="w-full h-full object-cover" />
          </div>
          <img src="/logo-text.png" alt="SellerCrew" className="h-6 object-contain" />
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-white/70 hover:text-white transition-colors">
            Features
          </a>
          <a href="#agents" className="text-sm text-white/70 hover:text-white transition-colors">
            AI Team
          </a>
          <a href="#pricing" className="text-sm text-white/70 hover:text-white transition-colors">
            Pricing
          </a>
        </div>
        <Button
          className="bg-white text-[#0B0F1A] hover:bg-white/90 h-9 px-4 text-sm rounded-lg font-medium"
          onClick={() => setView("dashboard")}
        >
          Get Started
        </Button>
      </div>
    </nav>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <div id="agents">
        <AgentShowcase />
      </div>
      <div id="features">
        <FeaturesSection />
      </div>
      <WorkflowSection />
      <div id="pricing">
        <PricingSection />
      </div>
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
