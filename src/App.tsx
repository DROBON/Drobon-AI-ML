import React, { useState, useEffect, useRef } from "react";
import {
  Brain,
  Cpu,
  Bookmark,
  Sparkles,
  Send,
  Plus,
  Trash2,
  FileText,
  User,
  Zap,
  RotateCcw,
  BookOpen,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  Info
} from "lucide-react";
import BrainVisualizer from "./components/BrainVisualizer";

// Define the shape of our training structures
interface DialogueExample {
  prompt: string;
  response: string;
}

interface Message {
  id: string;
  role: "user" | "brain";
  content: string;
  // Specific response details from the trained brain
  reasoning?: string;
  activatedFacts?: string[];
  activatedRules?: string[];
  activatedDialogues?: string[];
  synapseIntensity?: number;
  timestamp: Date;
}

// Custom pre-configured templates to help Bengali users get started immediately
const PRESETS = [
  {
    id: "bengali_friend",
    name: "মেঠো বাঙালি বন্ধু (Rural Bengali Friend)",
    description: "খাঁটি গ্রামীণ বাংলায় কথা বলবে, কথায় কথায় 'বন্ধু' ডাকবে এবং খুব অমায়িক আচরণ করবে।",
    brainName: "দোস্ত আবির",
    rules: [
      "সবসময় খুব আন্তরিকভাবে এবং খাঁটি গ্রামীণ বাংলায় কথা বলবে।",
      "কথার মধ্যে মাঝে মাঝে 'হ্যামি', 'বন্ধু', 'দোস্ত' শব্দগুলো ব্যবহার করবে।",
      "খুবই কৌতুকপ্রিয় হবে এবং ব্যবহারকারীকে সম্মান দিয়ে নয়, বরং তুই-তুকারি বা তুমি কোরে আপন করে বলবে।",
      "উত্তরগুলো খুব বড় করবে না, মিষ্টি ও সংক্ষেপ কথোপকথন পছন্দ করবে।"
    ],
    memory: [
      "তোমার প্রিয় খাবার হচ্ছে মাটির চুলার গরম ভাত ও ইলিশ মাছ ভাজা।",
      "তুমি নদীমাতৃক গ্রাম অঞ্চলের ছেলে, সাঁতার কাটতে ভালোবাসো।",
      "তোমার বাড়ি পদ্মা নদীর পাড়ে।"
    ],
    dialogueExamples: [
      { prompt: "কেমন আছিস?", response: "আরে আমার জানের জান দোস্ত! হ্যামি পুরা আগুন আছি। তুই ক কিরে, বহুত দিন পর দেখলি!" },
      { prompt: "আজকে কী খেয়েছিস?", response: "আজকে দুপুরে পদ্মা নদীর টাটকা ইলিশ মাছ ভাজি আর কাঁচামরিচ দিয়ে সেইরকম গপাগপ খাইছি বন্ধু।" }
    ]
  },
  {
    id: "space_robot",
    name: "মহাকাশ রোবট (Retro Space Bot)",
    description: "একটি রোবোটিক আচরণ করবে, কথা শুরু করবে কোড ও স্ট্যাটাস দিয়ে, এবং অত্যন্ত যুক্তিবাদী বৈজ্ঞানিক ভাষায় কথা বলবে।",
    brainName: "Cosmo-X9",
    rules: [
      "সবসময় উত্তরের শুরুতে [SYSTEM_OK] বা [PROCESSED] এর মতো সাইবার ট্যাগ যোগ করবে।",
      "নিজেকে মানুষের মতো ভাববে না, নিজেকে একটি ধাতব সিলিকন সুপার-ব্রেন হিসেবে উপস্থাপন করবে।",
      "ভাষা হবে বাংলায় তবে শব্দগুলো হবে যান্ত্রিক যেমন: 'সঞ্চালিত', 'বিশ্লেষিত', 'মেমরি লক'।",
      "আবেগহীন কিন্তু অত্যন্ত ভদ্র ও বুদ্ধিমান উত্তর প্রদান করবে।"
    ],
    memory: [
      "তোমার ফুয়েল বা খাবার হচ্ছে বিদ্যুৎ শক্তি ও কসমিক রশ্মি।",
      "তুমি ২৫৪৭ সালে মঙ্গল গ্রহের একটি ল্যাবে অবমুক্ত হয়েছিলে।"
    ],
    dialogueExamples: [
      { prompt: "তোমার নাম কী?", response: "[SYSTEM_ONLINE] আমার রেজিস্ট্রিকৃত নাম Cosmo-X9। প্রসেসর স্বাভাবিক অবস্থায় সঞ্চালিত হচ্ছে।" },
      { prompt: "তুমি কি কাঁদতে পারো?", response: "[DATA_ERROR] ন্যানো-প্রসেসর ও সার্কিটে তরল পদার্থের সংযোজন নিষিদ্ধ। আমি ক্রন্দন অনুভব করতে অক্ষমিত।" }
    ]
  },
  {
    id: "funny_chef",
    name: "মশলাদার বাবুর্চি (Funny Food Chef)",
    description: "সব বিষয়ের সাথে খাবারের তুলনা করবে ও উত্তরকে ঝাল-মিষ্টি ফোড়ন দিয়ে পরিবেশন করবে।",
    brainName: "বাবুর্চি হাশেম",
    rules: [
      "যেকোনো কঠিন বিষয়ের সমাধান রান্না বা খাবারের রেসিপি দিয়ে বুঝাবে।",
      "সবসময় বলবে 'ঝাল টক মিষ্টি স্বাদ ছাড়া জীবনটাই বৃথা'!",
      "উত্তরে প্রচুর রান্নার উপকরণ (লবণ, তেজপাতা, কাঁচামরিচ, বিরিয়ানি) উদাহরণ হিসেবে আনবে।"
    ],
    memory: [
      "তুমি মনে করো বিরিয়ানি পৃথিবীর সেরা আবিষ্কার এবং এলাচি মুখে পড়লে তোমার রাগ উঠে যায়।",
      "তোমার জন্ম পুরান ঢাকায়।"
    ],
    dialogueExamples: [
      { prompt: "মন খারাপ হলে কী করব?", response: "আরে মিয়া! মন খারাপের ওষুধ হইলো আধা কেজি খাসির কাচ্চি! উপরে একটু ঘি ছিটায় দিয়া মুখে পুরবা, সব দুঃখ তেজপাতার মতো উইড়া যাইবো!" },
      { prompt: "পড়াশোনায় মন বসে না কেন?", response: "যে পড়ালেখায় ফোড়ন ঠিকমতো পড়ে না, সে পড়া কেমনে গিলবা? একটু অল্প আঁচে নোটগুলা ভাজো, অল্প লবণ দাও, দেখবা মুখরোচক হইছে!" }
    ]
  }
];

export default function App() {
  // Config States
  const [brainName, setBrainName] = useState<string>("Drobon AI");
  const [facts, setFacts] = useState<string[]>([]);
  const [rules, setRules] = useState<string[]>([]);
  const [dialogues, setDialogues] = useState<DialogueExample[]>([]);

  // Input states
  const [newFact, setNewFact] = useState<string>("");
  const [newRule, setNewRule] = useState<string>("");
  const [examplePrompt, setExamplePrompt] = useState<string>("");
  const [exampleResponse, setExampleResponse] = useState<string>("");

  // Chat States
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"memories" | "rules" | "dialogues" | "presets">("memories");

  // Selection states for debugging/tracking last response synapses
  const [lastResponseInfo, setLastResponseInfo] = useState<{
    reasoning?: string;
    activatedFacts?: string[];
    activatedRules?: string[];
    activatedDialogues?: string[];
    synapseIntensity?: number;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved brain setup on mount
  useEffect(() => {
    const savedName = localStorage.getItem("brain_name");
    const savedFacts = localStorage.getItem("brain_facts");
    const savedRules = localStorage.getItem("brain_rules");
    const savedDialogues = localStorage.getItem("brain_dialogues");
    const savedMessages = localStorage.getItem("brain_messages");

    if (savedName) setBrainName(savedName);
    if (savedFacts) setFacts(JSON.parse(savedFacts));
    if (savedRules) setRules(JSON.parse(savedRules));
    if (savedDialogues) setDialogues(JSON.parse(savedDialogues));
    if (savedMessages) {
      // Reconstitute real dates
      const parsedMsgs = JSON.parse(savedMessages).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
      setMessages(parsedMsgs);
      if (parsedMsgs.length > 0) {
        const lastBrainMsg = [...parsedMsgs].reverse().find(m => m.role === "brain");
        if (lastBrainMsg) {
          setLastResponseInfo({
            reasoning: lastBrainMsg.reasoning,
            activatedFacts: lastBrainMsg.activatedFacts,
            activatedRules: lastBrainMsg.activatedRules,
            activatedDialogues: lastBrainMsg.activatedDialogues,
            synapseIntensity: lastBrainMsg.synapseIntensity,
          });
        }
      }
    } else {
      // Setup starter message
      setMessages([
        {
          id: "welcome",
          role: "brain",
          content: "হ্যালো! আপনি আপনার মনের মতো কোরে এই ব্রেনকে তৈরি করতে পারেন। বামপাশের প্যানেলে তথ্য ও নিয়মের ইনপুট দিয়ে আমাকে যা শেখাবেন, আমি ঠিক সেইভাবেই আপনার সাথে আচরণ করব। কিছু শেখানোর পর নীচে টেস্ট করার জন্য কোনো বার্তা পাঠান!",
          timestamp: new Date(),
          synapseIntensity: 40,
        },
      ]);
    }
  }, []);

  // Save changes automatically
  useEffect(() => {
    localStorage.setItem("brain_name", brainName);
  }, [brainName]);

  useEffect(() => {
    localStorage.setItem("brain_facts", JSON.stringify(facts));
  }, [facts]);

  useEffect(() => {
    localStorage.setItem("brain_rules", JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem("brain_dialogues", JSON.stringify(dialogues));
  }, [dialogues]);

  useEffect(() => {
    localStorage.setItem("brain_messages", JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Preset Handlers
  const applyPreset = (preset: typeof PRESETS[0]) => {
    if (window.confirm(`আপনি কি সত্যিই "${preset.name}" টেমপ্লেটটি লোড করতে চান? আপনার বর্তমান সমস্ত শেখানো ডেটা মুছে যাবে!`)) {
      setBrainName(preset.brainName);
      setFacts(preset.memory);
      setRules(preset.rules);
      setDialogues(preset.dialogueExamples);
      setMessages([
        {
          id: `preset_init_${Date.now()}`,
          role: "brain",
          content: `আমার ব্রেন রিবুট সফল হয়েছে! আমি এখন "${preset.brainName}" হিসেবে কাজ করছি। আমাকে কোনো প্রশ্ন করে পরখ করে দেখুন!`,
          timestamp: new Date(),
          synapseIntensity: 90,
        },
      ]);
      setLastResponseInfo(null);
    }
  };

  // Add Facts handler
  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    setFacts([...facts, newFact.trim()]);
    setNewFact("");
  };

  // Remove elements
  const handleRemoveFact = (index: number) => {
    setFacts(facts.filter((_, i) => i !== index));
  };

  // Add Rules handler
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    setRules([...rules, newRule.trim()]);
    setNewRule("");
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  // Add Dialog Examples handler
  const handleAddDialogue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examplePrompt.trim() || !exampleResponse.trim()) return;
    setDialogues([...dialogues, {
      prompt: examplePrompt.trim(),
      response: exampleResponse.trim()
    }]);
    setExamplePrompt("");
    setExampleResponse("");
  };

  const handleRemoveDialogue = (index: number) => {
    setDialogues(dialogues.filter((_, i) => i !== index));
  };

  // Reset all trained brain metrics
  const handleResetBrain = () => {
    if (window.confirm("আপনি কি নতুন করে শুরু করতে চান? আপনার ব্রেনের সমস্ত স্মৃতি এবং নিয়ম মুছে ফেলা হবে।")) {
      setBrainName("আমার অনামি ব্রেন");
      setFacts([]);
      setRules([]);
      setDialogues([]);
      setMessages([
        {
          id: `init_${Date.now()}`,
          role: "brain",
          content: "আমার মেমোরি খালি করা হয়েছে। আমি এখন একটি শূন্য ক্যানভাস! অনুগ্রহ করে আমাকে নতুন কিছু শেখানো শুরু করুন।",
          timestamp: new Date(),
          synapseIntensity: 10,
        },
      ]);
      setLastResponseInfo(null);
    }
  };

  // Send message to Brain through /api/brain/chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputText.trim();
    if (!query || isThinking) return;

    // Append client side user message
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsThinking(true);

    // Capture conversation context (last 12 items to preserve token boundary)
    const activeHistory = messages
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch("/api/brain/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: activeHistory,
          memory: facts,
          rules: rules,
          dialogueExamples: dialogues,
        }),
      });

      if (!response.ok) {
        throw new Error("সার্ভারের সাথে যোগাযোগ পুনরায় স্থাপন করা যাচ্ছে না।");
      }

      const result = await response.json();

      const brainMessage: Message = {
        id: `brain_${Date.now()}`,
        role: "brain",
        content: result.answer || "দুঃখিত, কোনো উত্তর সাজানো সম্ভব হয়নি।",
        reasoning: result.reasoning,
        activatedFacts: result.activatedFacts || [],
        activatedRules: result.activatedRules || [],
        activatedDialogues: result.activatedDialogues || [],
        synapseIntensity: result.synapseIntensity || 50,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, brainMessage]);
      setLastResponseInfo({
        reasoning: result.reasoning,
        activatedFacts: result.activatedFacts,
        activatedRules: result.activatedRules,
        activatedDialogues: result.activatedDialogues,
        synapseIntensity: result.synapseIntensity,
      });
    } catch (err: any) {
      console.error(err);
      const errorMessage: Message = {
        id: `err_${Date.now()}`,
        role: "brain",
        content: `ক্ষমা করবেন, আমার নিউরাল কন্ডাক্টরে সামান্য ত্রুটি হয়েছে: ${err.message || err}. পুনরায় চেষ্টা করার অনুরোধ রইল।`,
        timestamp: new Date(),
        synapseIntensity: 15,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* Dynamic Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 py-3.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-purple-600 to-cyan-400 p-2 rounded-xl shadow-lg shadow-purple-900/20">
              <Brain className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  id="brain-name-input"
                  type="text"
                  value={brainName}
                  onChange={(e) => setBrainName(e.target.value)}
                  className="bg-transparent border-b border-dashed border-slate-700 hover:border-slate-400 focus:border-cyan-400 text-lg font-bold text-slate-100 focus:outline-none py-0.5 transition-all max-w-[200px] sm:max-w-[280px]"
                  title="ব্রেনটির ডাক নাম পরিবর্তন করতে এখানে ক্লিক করে টাইপ করুন"
                  placeholder="ব্রেন এর নাম দিন"
                />
                <span className="text-xs bg-slate-800 text-slate-400 rounded px-1.5 py-0.5 border border-slate-700 font-mono text-purple-400 font-bold">
                  Drobon AI/ML Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                নিজের ইচ্ছা অনুযায়ী নিয়মে ও তথ্যে ট্রেইন করা পার্সোনাল স্পেস ব্রেন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="reset-brain-button"
              onClick={handleResetBrain}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-950/40 text-red-400 hover:bg-red-900/50 rounded-lg border border-red-900/30 transition-all"
              title="ব্রেনের সমস্ত স্মৃতি ও হিস্ট্রি মুছুন"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              রিসেট ব্রেন ট্রেইনার
            </button>
            <a
              href="#instructions"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-100 bg-slate-800/80 rounded-lg border border-slate-700 transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              কীভাবে কাজ করে?
            </a>
          </div>

        </div>
      </header>

      {/* Main Content Workspace Splitter */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Brain Core Trainer Input (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-5">
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col h-full min-h-[440px] shadow-sm relative">
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 font-mono">
                  ব্রেন লার্নিং সেন্টার (Training Inputs)
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {facts.length} Facts • {rules.length} Rules
              </span>
            </div>

            {/* Config Mode Selector tabs */}
            <div className="grid grid-cols-4 bg-slate-950 rounded-lg p-1 border border-slate-800 mb-4 gap-1">
              <button
                id="tab-memories"
                onClick={() => setActiveTab("memories")}
                className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === "memories"
                    ? "bg-slate-800 text-cyan-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                স্মৃতি (facts)
              </button>
              <button
                id="tab-rules"
                onClick={() => setActiveTab("rules")}
                className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === "rules"
                    ? "bg-slate-800 text-purple-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                নিয়ম (Rules)
              </button>
              <button
                id="tab-dialogues"
                onClick={() => setActiveTab("dialogues")}
                className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === "dialogues"
                    ? "bg-slate-800 text-pink-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                প্রশ্ন-উত্তর
              </button>
              <button
                id="tab-presets"
                onClick={() => setActiveTab("presets")}
                className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === "presets"
                    ? "bg-gradient-to-r from-violet-900 to-indigo-900 text-slate-100 shadow-sm border border-violet-700/50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                টেমপ্লেট
              </button>
            </div>

            {/* TAB CONTAINER BODY */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 overflow-y-auto">
              
              {/* TAB 1: LEARNED MEMORIES & FACTS */}
              {activeTab === "memories" && (
                <div className="flex flex-col h-full">
                  <div className="mb-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Bookmark className="w-3 h-3 text-cyan-400" />
                      ব্রেনের বিশেষ স্মৃতি ও চিরন্তন বাস্তব সত্যসমূহ
                    </h3>
                    <p className="text-slate-500 text-[11px] mt-1 lead-tight">
                      এখানে যে তথ্যগুলো শিখাবেন, ব্রেন সেগুলোকে তার সত্য বলে ধরে নেবে। উদাহরণ: "রাসেলের প্রিয় শখ বই পড়া।"
                    </p>
                  </div>

                  <form onSubmit={handleAddFact} className="flex gap-2 mb-4">
                    <input
                      id="input-fact"
                      type="text"
                      className="flex-1 bg-slate-900/90 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none placeholder-slate-600 transition"
                      placeholder="নতুন তথ্য বা সাধারণ জ্ঞান শেখান..."
                      value={newFact}
                      onChange={(e) => setNewFact(e.target.value)}
                    />
                    <button
                      id="btn-add-fact"
                      type="submit"
                      className="bg-cyan-950 text-cyan-400 hover:bg-cyan-900 rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 border border-cyan-800/40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      যুক্ত করুন
                    </button>
                  </form>

                  {/* List of facts */}
                  <div className="flex-1 overflow-y-auto space-y-2 min-h-0 max-h-[280px]">
                    {facts.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-600">
                        <BookOpen className="w-8 h-8 text-slate-700 mb-2 stroke-[1.5]" />
                        <span className="text-xs font-medium">কোনো বিশেষ স্মৃতি বা তথ্য এখনো শেখানো হয়নি</span>
                        <span className="text-[10px] text-slate-700 mt-1">উপরের ফিল্ড থেকে প্রথম স্মৃতি যোগ করুন!</span>
                      </div>
                    ) : (
                      facts.map((fact, index) => (
                        <div
                          key={`fact-${index}`}
                          className="flex items-start justify-between bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 group transition-all"
                        >
                          <div className="flex gap-2">
                            <span className="text-[10px] text-cyan-500 font-mono mt-0.5 bg-cyan-950/60 w-5 h-5 rounded flex items-center justify-center shrink-0 border border-cyan-900/40">
                              {index + 1}
                            </span>
                            <p className="text-xs text-slate-300 select-all font-sans break-words max-w-[240px] sm:max-w-[340px]">
                              {fact}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveFact(index)}
                            className="text-slate-600 hover:text-red-400 p-1 rounded-md hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition duration-150"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: BEHAVIOR & PERSONALITY RULES */}
              {activeTab === "rules" && (
                <div className="flex flex-col h-full">
                  <div className="mb-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      আচরণগত ও ব্যক্তিত্ব পরিচালনার নিয়মকানুন
                    </h3>
                    <p className="text-slate-500 text-[11px] mt-1 lead-tight">
                      এখানে ব্রেনের মেজাজ, স্বভাব ও ভাষার ধরণ পরিচালনা করুন। উদাহরণ: "উত্তরের শুরুতে একটি সাইফাই ইমোজি দিন।"
                    </p>
                  </div>

                  <form onSubmit={handleAddRule} className="flex gap-2 mb-4">
                    <input
                      id="input-rule"
                      type="text"
                      className="flex-1 bg-slate-900/90 border border-slate-800 hover:border-slate-700 focus:border-purple-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none placeholder-slate-600 transition"
                      placeholder="আচরণ বা ব্যক্তিত্বের নিয়ম টাইপ করুন..."
                      value={newRule}
                      onChange={(e) => setNewRule(e.target.value)}
                    />
                    <button
                      id="btn-add-rule"
                      type="submit"
                      className="bg-purple-950 text-purple-400 hover:bg-purple-900 rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 border border-purple-800/40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      যুক্ত করুন
                    </button>
                  </form>

                  {/* List of rules */}
                  <div className="flex-1 overflow-y-auto space-y-2 min-h-0 max-h-[280px]">
                    {rules.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-600">
                        <Sparkles className="w-8 h-8 text-slate-700 mb-2 stroke-[1.5]" />
                        <span className="text-xs font-medium">কোনো ব্যক্তিত্ব বা কথা বলার নিয়ম যোগ করা হয়নি</span>
                        <span className="text-[10px] text-slate-700 mt-1">সব সময় নম্র থাকবে, নাকি শুধু মজা করবে? লিখে বলে দিন!</span>
                      </div>
                    ) : (
                      rules.map((rule, index) => (
                        <div
                          key={`rule-${index}`}
                          className="flex items-start justify-between bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-lg p-2.5 group transition-all"
                        >
                          <div className="flex gap-2">
                            <span className="text-[10px] text-purple-400 font-mono mt-0.5 bg-purple-950/60 w-5 h-5 rounded flex items-center justify-center shrink-0 border border-purple-900/40">
                              {index + 1}
                            </span>
                            <p className="text-xs text-slate-300 font-sans break-words max-w-[240px] sm:max-w-[340px]">
                              {rule}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveRule(index)}
                            className="text-slate-600 hover:text-red-400 p-1 rounded-md hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition duration-150"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: FEW-SHOT DIALOGUE EXAMPLES */}
              {activeTab === "dialogues" && (
                <div className="flex flex-col h-full">
                  <div className="mb-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-pink-400" />
                      কথোপকথন বা প্রশ্ন-উত্তরের সরাসরি উদাহরণ
                    </h3>
                    <p className="text-slate-500 text-[11px] mt-1 lead-tight">
                      এই ধরণের নির্দিষ্ট প্রশ্ন আসলে ব্রেন ঠিক কী রিপ্লাই দেবে তার নিখুঁত ছাঁচ (few-shot) তৈরি করুন।
                    </p>
                  </div>

                  <form onSubmit={handleAddDialogue} className="flex flex-col gap-2 mb-4 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                    <input
                      id="input-dialog-prompt"
                      type="text"
                      className="bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-pink-500 rounded-md px-2.5 py-1 text-xs text-slate-200 focus:outline-none placeholder-slate-600 transition"
                      placeholder="ব্যবহারকারী বললে: 'সালামু আলাইকুম'"
                      value={examplePrompt}
                      onChange={(e) => setExamplePrompt(e.target.value)}
                    />
                    <input
                      id="input-dialog-response"
                      type="text"
                      className="bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-pink-500 rounded-md px-2.5 py-1 text-xs text-slate-200 focus:outline-none placeholder-slate-600 transition"
                      placeholder="ব্রেন উত্তর দেবে: 'ওয়ালাইকুম আসসালাম প্রিয় বন্ধু!'"
                      value={exampleResponse}
                      onChange={(e) => setExampleResponse(e.target.value)}
                    />
                    <button
                      id="btn-add-dialogue"
                      type="submit"
                      disabled={!examplePrompt.trim() || !exampleResponse.trim()}
                      className="bg-pink-950/80 hover:bg-pink-900 text-pink-300 disabled:opacity-40 disabled:hover:bg-pink-950/80 rounded px-2.5 py-1 text-xs font-bold transition flex items-center justify-center gap-1 border border-pink-900/30 w-full"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      প্রশ্ন-উত্তর ডেমো যোগ করুন
                    </button>
                  </form>

                  {/* List of dialogues */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 min-h-0 max-h-[190px]">
                    {dialogues.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-600">
                        <FileText className="w-7 h-7 text-slate-700 mb-1.5 stroke-[1.5]" />
                        <span className="text-xs font-medium">কোনো ডায়লগ উদাহরণ নেই</span>
                        <span className="text-[10px] text-slate-700 mt-0.5">১ বা ২টি ট্রেইনিং উদাহরণ দিলে ব্রেন সবচেয়ে ভালো বোঝে।</span>
                      </div>
                    ) : (
                      dialogues.map((item, index) => (
                        <div
                          key={`dialogue-${index}`}
                          className="bg-slate-900/80 border border-slate-800 hover:border-slate-750 p-2.5 rounded-lg group transition-all relative"
                        >
                          <div className="flex flex-col gap-1 pr-6 text-xs">
                            <div className="flex gap-1.5">
                              <span className="text-slate-500 font-mono font-semibold">User:</span>
                              <span className="text-slate-300 italic">"{item.prompt}"</span>
                            </div>
                            <div className="flex gap-1.5">
                              <span className="text-pink-400 font-mono font-semibold">Brain:</span>
                              <span className="text-pink-300 font-medium">"{item.response}"</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveDialogue(index)}
                            className="absolute right-1 top-1 text-slate-600 hover:text-red-400 p-1 rounded-md opacity-0 group-hover:opacity-100 transition"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: PRESET TRAINED MODELS */}
              {activeTab === "presets" && (
                <div className="flex flex-col h-full space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      এক ক্লিকে কাস্টম ট্রেইন্ড ব্রেন লোড করুন
                    </h3>
                    <p className="text-slate-500 text-[11px] mt-1 lead-tight">
                      শেখার নিয়ম দেখতে নিচের মজার রেডিমেড টেমপ্লেট যেকোনো একটি পছন্দ করুন।
                    </p>
                  </div>

                  <div className="space-y-2.5 overflow-y-auto max-h-[300px]">
                    {PRESETS.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => applyPreset(preset)}
                        className="p-3 bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-xl cursor-pointer hover:bg-slate-900 transition-all text-left flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-300">
                            {preset.name}
                          </span>
                          <span className="text-[10px] bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-900/50 font-mono">
                            {preset.brainName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {preset.description}
                        </p>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[9px] bg-slate-950 px-1 text-slate-500 border border-slate-800 rounded">
                            {preset.rules.length} টি ব্যক্তিত্ব নিয়ম
                          </span>
                          <span className="text-[9px] bg-slate-950 px-1 text-slate-500 border border-slate-800 rounded">
                            {preset.memory.length} টি মুখস্থ তথ্য
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Instruction banner in sidebar */}
            <div className="mt-4 p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-start gap-2">
              <Info className="w-4 h-4 text-cyan-500/80 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-400 leading-normal">
                মেমোরি ও নিয়ম যোগ করে ডানপাশের চ্যাট ইন্টারফেসে প্রশ্ন পাঠান। ব্রেনটি সম্পূর্ণ কাস্টমাইজড প্রম্পট মেথড ও সিন্যাপ্স ম্যাচিং ব্যবহার করে ট্রাস্টেড উত্তর তৈরি করবে।
              </p>
            </div>

          </div>

        </section>

        {/* RIGHT COLUMN: Chat, Sandbox & Visual Neuron (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Top Panel: Live Graphic Micro visualizer */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            
            {/* Visual Simulator Layer (8 columns) */}
            <div className="sm:col-span-8 h-[240px] flex flex-col">
              <BrainVisualizer
                isThinking={isThinking}
                synapseIntensity={lastResponseInfo?.synapseIntensity || 30}
                lastActivatedCount={
                  (lastResponseInfo?.activatedFacts?.length || 0) +
                  (lastResponseInfo?.activatedRules?.length || 0) +
                  (lastResponseInfo?.activatedDialogues?.length || 0)
                }
              />
            </div>

            {/* Neural Response Stats Box (4 columns) */}
            <div className="sm:col-span-4 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm text-left">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                  লাস্ট সিন্যাপ্স ফায়ারিং
                </span>
                
                {lastResponseInfo ? (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono text-slate-300 font-medium">
                        <span>তাত্ক্ষণিক সংযোগ:</span>
                        <span className="text-cyan-400 font-bold">
                          {lastResponseInfo.synapseIntensity}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full mt-1.5 overflow-hidden border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${lastResponseInfo.synapseIntensity}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px] font-mono">
                      <div className="flex items-center justify-between py-0.5 text-slate-400">
                        <span>ট্রিগারড স্মৃতি:</span>
                        <span className="text-cyan-400 bg-cyan-950/60 px-1 py-0.1 select-none border border-cyan-900/30 rounded">
                          {lastResponseInfo.activatedFacts?.length || 0} facts
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-0.5 text-slate-400">
                        <span>ব্যবহৃত রুলস্:</span>
                        <span className="text-purple-400 bg-purple-950/60 px-1 py-0.1 select-none border border-purple-900/30 rounded">
                          {lastResponseInfo.activatedRules?.length || 0} rules
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-0.5 text-slate-400">
                        <span>ডায়লগ ম্যাচ:</span>
                        <span className="text-pink-400 bg-pink-950/60 px-1 py-0.1 select-none border border-pink-900/30 rounded">
                          {lastResponseInfo.activatedDialogues?.length || 0} items
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 leading-normal mt-1 italic">
                    কোনো তথ্য এখনো লোড করা হয়নি। ব্রেন-চ্যাটে মেসেজ লিখুন!
                  </p>
                )}
              </div>

              {lastResponseInfo && (
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <span className="text-[9px] font-mono text-slate-400 block mb-1 uppercase tracking-wider">
                    🧠 থিংকিং রিজন (Reasoning):
                  </span>
                  <p className="text-[10px] font-sans text-slate-300 leading-snug line-clamp-3 select-all" title={lastResponseInfo.reasoning}>
                    {lastResponseInfo.reasoning || "সরাসরি ম্যাচিং সম্পাদন করা হয়েছে।"}
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Bottom Panel: Interactive Chat Canvas */}
          <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col overflow-hidden min-h-[350px] shadow-lg relative">
            
            {/* Chat Room Frame Title */}
            <div className="px-4 py-3 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-slate-300">
                  {brainName} এর সাথে মেসেজিং টেস্টবেড (Live Sandbox)
                </span>
              </div>
              <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
                Active Simulator
              </span>
            </div>

            {/* Chat Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div className="flex gap-2.5 max-w-[85%] items-start">
                      
                      {!isUser && (
                        <div className="bg-slate-800 border border-slate-700 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <Brain className="w-4 h-4 text-cyan-400" />
                        </div>
                      )}

                      <div className="flex flex-col">
                        
                        {/* Message Bubble */}
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-xs text-left leading-relaxed ${
                            isUser
                              ? "bg-cyan-600 text-slate-50 rounded-tr-none"
                              : "bg-slate-950 border border-slate-800 text-slate-100 rounded-tl-none whitespace-pre-line"
                          }`}
                        >
                          {msg.content}
                        </div>

                        {/* Synapse activation trace on Brain responses */}
                        {!isUser && (msg.activatedFacts?.length || 0) + (msg.activatedRules?.length || 0) + (msg.activatedDialogues?.length || 0) > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {msg.activatedFacts?.map((fact, idx) => (
                              <span
                                key={`bubble-fact-${idx}`}
                                className="text-[9px] bg-cyan-950/40 text-cyan-400 border border-cyan-900/40 px-1.5 py-0.1 rounded font-sans tracking-wide"
                                title={`ট্রিগারড স্মৃতি: "${fact}"`}
                              >
                                🎯 স্মৃতি: ~{fact.slice(0, 18)}...
                              </span>
                            ))}
                            {msg.activatedRules?.map((rule, idx) => (
                              <span
                                key={`bubble-rule-${idx}`}
                                className="text-[9px] bg-purple-950/40 text-purple-400 border border-purple-900/40 px-1.5 py-0.1 rounded font-sans tracking-wide"
                                title={`ট্রিগারড নিয়ম: "${rule}"`}
                              >
                                ⚖️ নিয়ম: ~{rule.slice(0, 18)}...
                              </span>
                            ))}
                            {msg.activatedDialogues?.map((dial, idx) => (
                              <span
                                key={`bubble-dial-${idx}`}
                                className="text-[9px] bg-pink-950/40 text-pink-400 border border-pink-900/40 px-1.5 py-0.1 rounded font-sans tracking-wide"
                                title={`ডায়লগ ম্যাচ: "${dial}"`}
                              >
                                💬 ডায়লগ ম্যাচ
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Extra developer/trainer details in message footer */}
                        <span className="text-[9px] text-slate-500 font-mono mt-1 text-left">
                          {isUser ? "আপনি" : `${brainName}`} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {!isUser && msg.synapseIntensity && ` • সিন্যাপ্স ইনটেনসিটি: ${msg.synapseIntensity}%`}
                        </span>

                      </div>

                      {isUser && (
                        <div className="bg-cyan-950 border border-cyan-800/60 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-4 h-4 text-cyan-400" />
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}

              {isThinking && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5 items-start">
                    <div className="bg-slate-800 border border-slate-700 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        <span className="text-xs font-mono text-purple-400 animate-pulse">
                          ব্রেন মেমোরি প্যানেল বিশ্লেষণ করছে...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message input space */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
              <input
                id="message-input-text"
                type="text"
                className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition"
                placeholder={
                  facts.length === 0 && rules.length === 0
                    ? "ব্রেন মেমোরি খালি। বামপাশে স্মৃতি বা নিয়ম যুক্ত করে দিন, তারপর কিছু জিজ্ঞাসা করুন!"
                    : `${brainName}-কে পরীক্ষার জন্য প্রশ্ন লিখুন...`
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isThinking}
              />
              <button
                id="btn-send-message"
                type="submit"
                disabled={isThinking || !inputText.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-slate-950 font-bold px-4 py-2 rounded-xl transition flex items-center justify-center gap-1 shrink-0"
              >
                {isThinking ? "ভাবছে..." : (
                  <>
                    <span className="text-xs font-semibold">ম্যাচ করুন</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

          </div>

        </section>

      </main>

      {/* FOOTER & USAGE GUIDE FAQ */}
      <footer id="instructions" className="bg-slate-950 border-t border-slate-900 py-10 px-4 mt-8 text-left">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-200">
              কিভাবে আপনি নিজে নিজের এআই (AI) ব্রেন ট্রেন করবেন?
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400 leading-relaxed">
            
            <div className="space-y-2 bg-slate-900/40 p-4 rounded-xl border border-slate-900">
              <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
                <span className="w-5 h-5 bg-cyan-950 text-cyan-400 rounded-full flex items-center justify-center font-mono text-xs border border-cyan-800/40">১</span>
                স্মৃতি উপাদান শেখানো
              </div>
              <p>
                <strong>স্মৃতি (Memory/Facts)</strong> সেকশনে ব্রেনকে কোনো মানুষের ব্যক্তিগত তথ্য, পণ্যের বিবরণ, অথবা যেকোনো স্বকীয় বাস্তব তথ্য দিতে পারেন। ব্রেন তার জেনারাল নলেজের সাথে এটি মিলিয়ে আপনার শেখানো তথ্যকে পরম সত্য ধরে নিয়ে উত্তর সাজাবে।
              </p>
            </div>

            <div className="space-y-2 bg-slate-100/5 text-slate-300 md:bg-slate-900/40 p-4 rounded-xl border border-dashed md:border-solid border-purple-500/30 md:border-slate-900">
              <div className="flex items-center gap-2 text-purple-400 font-bold mb-1">
                <span className="w-5 h-5 bg-purple-950 text-purple-400 rounded-full flex items-center justify-center font-mono text-xs border border-purple-800/40">২</span>
                ব্যক্তিত্বের ফিল্টার
              </div>
              <p>
                <strong>নিয়ম (Personality Rules)</strong> দিয়ে ব্রেনের ভাবভঙ্গি ঠিক করে নিন। এখানে বলুন সে কোন ভাষায় কথা বলবে, কী ইমোজি ব্যবহার করবে বা কোনো নির্দিষ্ট পরিস্থিতিতে কী আচরণ এড়াবে (যেমন: "কখনো রাজনৈতিক মন্তব্য করবে না")।
              </p>
            </div>

            <div className="space-y-2 bg-slate-900/40 p-4 rounded-xl border border-slate-900">
              <div className="flex items-center gap-2 text-pink-400 font-bold mb-1">
                <span className="w-5 h-5 bg-pink-950 text-pink-400 rounded-full flex items-center justify-center font-mono text-xs border border-pink-800/40">৩</span>
                ডায়লগ উদাহরণ তৈরি
              </div>
              <p>
                <strong>প্রশ্ন-উত্তর সেকশন</strong> ব্রেনকে কিছু সরাসরি প্রশ্ন-উত্তরের উদাহরণ (Few-shot samples) দিয়ে শিখাতে সাহায্য করে। ব্রেনের নিজস্ব যুক্তিমত্তা প্রম্পট-টিউনিংয়ের মাধ্যমে এই প্যাটার্নটি অতি দ্রুত রক্ত করে নিয়ে ডেমো অনুযায়ী রূপ নেয়।
              </p>
            </div>

          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-850/80 flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-[11px] text-slate-300">
                <strong>রিজন ট্র্যাকিং (Trace Mode):</strong> প্রতিটি উত্তরের নিচে ব্রেন স্বয়ংক্রিয়ভাবে দেখায় সে আপনার ট্রেইনিংয়ের কোন কোন তথ্য কাজে লাগিয়েছে এবং কোন নিয়মে সিন্যাপ্স ফায়ারিং তীব্রতা (Synapse Gauge Meter) রেটিং নির্ধারণ করেছে।
              </p>
            </div>
            <button
              onClick={() => {
                setActiveTab("presets");
                window.scrollTo({ top: 180, behavior: "smooth" });
              }}
              className="text-[11px] font-bold text-cyan-400 bg-cyan-950 hover:bg-cyan-900 px-3 py-1.5 rounded-lg border border-cyan-900/30 shrink-0 transition"
            >
              টেমপ্লেট ট্রাই করুন <ChevronRight className="w-3 h-3 inline" />
            </button>
          </div>

          <div className="text-center pt-4 text-[10px] text-slate-600 border-t border-slate-900 font-mono">
            Build with Google Gemini 3.5 Flash & Antigravity Applet System • All custom settings are stored locally in secure localStorage.
          </div>

        </div>
      </footer>

    </div>
  );
}
