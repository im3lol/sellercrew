"use client";

import { useAppStore } from "@/lib/store";
import { agents } from "@/lib/agents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useDashboardStore } from "@/lib/dashboard-store";

interface ChatMessage {
  id: string;
  agentId: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export function AgentsView() {
  const { selectedAgent, setSelectedAgent } = useAppStore();
  const [activeAgentId, setActiveAgentId] = useState(selectedAgent || "ali");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const addActivity = useDashboardStore((state) => state.addActivity);

  const activeAgent = agents.find((a) => a.id === activeAgentId)!;

  useEffect(() => {
    if (selectedAgent) setActiveAgentId(selectedAgent);
  }, [selectedAgent]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      agentId: activeAgentId,
      content: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/agent-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: activeAgentId,
          message: userMessage.content,
          systemPrompt: activeAgent.systemPrompt,
          history: messages.map((message) => ({
            role: message.isUser ? "user" : "assistant",
            content: message.content,
          })),
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            agentId: activeAgentId,
            content: data.content,
            isUser: false,
            timestamp: new Date(),
          },
        ]);
        addActivity(activeAgentId, `Responded to: ${userMessage.content.slice(0, 70)}`);
        setIsLoading(false);
        return;
      }
    } catch {
      toast.info("Using the local agent fallback.");
    }

    // Simulate AI response
    setTimeout(() => {
      const agent = agents.find((a) => a.id === activeAgentId)!;
      const responses: Record<string, string[]> = {
        ali: [
          "I'll coordinate the team to handle this. Let me assign the right agents for your request.",
          "Great question! I'll have Raed analyze the product and Bayan draft the content. Let me orchestrate this.",
          "I've reviewed your request. Here's my plan: Raed will research, Fares will check competitors, and Bayan will write the listing.",
        ],
        raed: [
          "I've analyzed the product details. Here are the key features and benefits I've identified for your listing.",
          "Based on my research, this product has strong potential in the premium segment. The key differentiators are quality and features.",
          "Let me break down the product positioning. The main value propositions are durability, performance, and user experience.",
        ],
        fares: [
          "The market analysis shows growing demand in this category. Key competitors are pricing between $29-59.",
          "I've identified 3 main competitors. The market gap is in the mid-range with premium features segment.",
          "Current trends show increasing search volume for this product type. Seasonal peak is approaching.",
        ],
        noor: [
          "I've reviewed the visual assets. I recommend 7 images total: 1 hero, 2 lifestyle, 3 infographics, and 1 packaging shot.",
          "The current images could be improved. Better lighting and more dynamic angles would increase click-through rate.",
          "For optimal conversion, your main image should show the product at a 30-degree angle with all accessories visible.",
        ],
        hakim: [
          "I recommend a benefit-driven listing structure. Lead with the biggest pain point your product solves.",
          "Your listing strategy should focus on the premium positioning. Emphasize quality and unique features over price.",
          "The conversion strategy is clear: hook with the title, validate with bullets, and close with the description.",
        ],
        saleem: [
          "I've checked the listing against Amazon's policies. There are 2 areas that need adjustment for compliance.",
          "Your listing passes compliance checks. The claims are substantiated and there are no restricted terms.",
          "Watch out for these common policy violations: promotional pricing claims, unverified certifications, and restricted keywords.",
        ],
        bayan: [
          "I've crafted a compelling title that's optimized for both search and conversion. It's within the 200-char limit.",
          "Here are 5 bullet points that lead with benefits and support with features. Each is under 500 characters.",
          "The description uses emotional triggers and logical arguments to drive purchase decisions. A+ content is ready.",
        ],
        nadeem: [
          "I've identified 15 high-priority keywords. The top 3 should go in your title, the rest in bullets and backend.",
          "Your keyword strategy should focus on long-tail phrases with lower competition but high conversion intent.",
          "Search intent mapping shows buyers are looking for 'quality' and 'durability' - make sure these appear prominently.",
        ],
        rayan: [
          "The creative direction should emphasize premium lifestyle positioning. Think aspirational but accessible.",
          "For brand voice, I recommend: confident, knowledgeable, and helpful. Avoid being overly technical or casual.",
          "The visual concept should tell a story: problem → solution → lifestyle transformation. Each image advances the narrative.",
        ],
        adam: [
          "I've optimized the agent prompts for better output quality. The key is being specific about Amazon listing requirements.",
          "For best results, the workflow should be: Research → Strategy → Draft → Optimize → Comply → Review.",
          "I've tuned the generation parameters for more consistent and compliant output. The agents will produce better results now.",
        ],
        badr: [
          "Quality check complete. The listing scores 92/100 on our quality rubric. Minor improvements needed in keyword density.",
          "I've verified consistency across all listing elements. Title, bullets, and description are aligned and coherent.",
          "Final validation passed. The listing is ready for submission. No compliance issues or quality concerns detected.",
        ],
      };

      const agentResponses = responses[activeAgentId] || responses["ali"];
      const randomResponse = agentResponses[Math.floor(Math.random() * agentResponses.length)];

      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        agentId: activeAgentId,
        content: randomResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, agentMessage]);
      addActivity(activeAgentId, `Responded locally to: ${userMessage.content.slice(0, 70)}`);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] max-w-5xl flex-col gap-4 md:h-[calc(100vh-8rem)] md:flex-row md:gap-6">
      {/* Agent List */}
      <div className="w-full shrink-0 md:w-64">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">AI Agents</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-24 md:h-[calc(100vh-16rem)]">
              <div className="flex gap-2 px-3 pb-3 md:block md:space-y-1">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setActiveAgentId(agent.id);
                      setSelectedAgent(agent.id);
                    }}
                    className={`flex min-w-36 items-center gap-2 rounded-lg p-2 transition-colors md:w-full md:min-w-0 ${
                      activeAgentId === agent.id
                        ? "bg-[#0B0F1A] text-white"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border"
                      style={{
                        borderColor:
                          activeAgentId === agent.id ? agent.color : agent.color + "60",
                      }}
                    >
                      <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className={`text-sm font-medium truncate ${activeAgentId === agent.id ? "text-white" : "text-[#0B0F1A]"}`}>
                        {agent.name}
                      </p>
                      <p className={`text-xs truncate ${activeAgentId === agent.id ? "text-white/60" : "text-gray-400"}`}>
                        {agent.role}
                      </p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Agent Header */}
        <Card className="shrink-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl overflow-hidden border-2"
              style={{ borderColor: activeAgent.color }}
            >
              <img src={activeAgent.avatar} alt={activeAgent.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[#0B0F1A]">{activeAgent.name}</p>
                <Badge variant="outline" className="text-xs">
                  {activeAgent.role}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                {activeAgent.responsibilities.join(" • ")}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-gray-500">Online</span>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="flex-1 mt-3 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <div
                  className="w-16 h-16 rounded-2xl overflow-hidden border-2 mb-4"
                  style={{ borderColor: activeAgent.color }}
                >
                  <img
                    src={activeAgent.avatar}
                    alt={activeAgent.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-[#0B0F1A] mb-1">
                  Chat with {activeAgent.name}
                </h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  {activeAgent.role}. Ask about{" "}
                  {activeAgent.responsibilities.slice(0, 2).join(", ").toLowerCase()}, and more.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const agent = agents.find((a) => a.id === msg.agentId)!;
                  return msg.isUser ? (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[70%] bg-[#0B0F1A] text-white p-3 rounded-xl rounded-br-sm">
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} className="flex gap-2">
                      <div
                        className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border"
                        style={{ borderColor: agent.color + "60" }}
                      >
                        <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="max-w-[70%] bg-gray-100 p-3 rounded-xl rounded-bl-sm">
                        <p className="text-xs font-medium text-gray-500 mb-1">{agent.name}</p>
                        <p className="text-sm text-[#0B0F1A] leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex gap-2">
                    <div
                      className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border"
                      style={{ borderColor: activeAgent.color + "60" }}
                    >
                      <img src={activeAgent.avatar} alt={activeAgent.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-gray-100 p-3 rounded-xl rounded-bl-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        <span className="text-sm text-gray-400">{activeAgent.name} is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                placeholder={`Ask ${activeAgent.name} anything...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-[#0B0F1A] hover:bg-[#0B0F1A]/90 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
