import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Brain, Zap, MessageSquare, Clock, Shield, Check, Star, ChevronDown, Target, Rocket, Users, TrendingUp, Eye, Lightbulb, Coffee, Briefcase, Network, Cpu, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useRef } from "react"

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])

  // Sticky Navbar Component
  const Navbar = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-br from-black via-zinc-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-2xl font-black text-white">KAI</span>
          </div>
          
          {/* Go Kai Button */}
          <motion.div
            animate={{
              boxShadow: [
                "0 0 20px rgba(156, 163, 175, 0.3)",
                "0 0 30px rgba(59, 130, 246, 0.5)",
                "0 0 20px rgba(156, 163, 175, 0.3)"
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="rounded-2xl"
          >
            <Button 
              size="lg"
              className="bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-blue-600 hover:to-blue-500 text-white px-8 py-3 text-lg font-bold rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105"
              onClick={() => window.location.href = "/auth?mode=signup"}
            >
              <Rocket className="mr-2 w-5 h-5" />
              Go Kai!
            </Button>
          </motion.div>
        </div>
      </div>
    </nav>
  )

  // Epic Hero Section - KAI Revolution
  const Hero = () => (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-black via-zinc-900 to-black">
      {/* Subtle background elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_35%,rgba(255,255,255,0.02)_50%,transparent_65%)] animate-pulse" />
        <motion.div
          style={{ y }}
          className="absolute inset-0"
        >
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-10"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </motion.div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Epic Copy */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center lg:text-left space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <Badge className="bg-gradient-to-r from-zinc-800 to-zinc-700 text-white border-zinc-600 px-6 py-2 text-sm font-bold mb-6">
                <Cpu className="w-4 h-4 mr-2 text-zinc-300" />
                Powered by 1k Model
              </Badge>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight"
            >
              Your true proactive
              <br />
              <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                personal assistant
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-xl text-zinc-300 leading-relaxed max-w-2xl"
            >
              KAI learns everything about you, anticipates your needs, and helps you accomplish things you never thought were possible. Experience assistance that goes beyond imagination.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex justify-center"
            >
              <Button 
                size="lg"
                className="bg-white text-black hover:bg-zinc-100 px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-white/10 transition-all duration-300 transform hover:scale-105"
                onClick={() => window.location.href = "/auth?mode=signup"}
              >
                <Rocket className="mr-3 w-6 h-6" />
                Deploy KAI Now
                <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="flex items-center gap-8 pt-8"
            >
              <div className="flex -space-x-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border-4 border-zinc-900 flex items-center justify-center text-white font-bold">
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
                              <div className="text-zinc-400">
                  <p className="font-semibold text-white">2,847 professionals</p>
                  <p className="text-sm">achieving the impossible</p>
                </div>
            </motion.div>
          </motion.div>

          {/* Right: Interactive AGI Interface */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="relative"
          >
            <div className="relative">
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-zinc-500/5 rounded-3xl blur-3xl transform scale-110" />
              
              {/* Main AGI interface */}
              <div className="relative bg-black/40 backdrop-blur-2xl rounded-3xl border border-zinc-700/50 p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-zinc-500 rounded-full" />
                  <div className="w-3 h-3 bg-zinc-400 rounded-full" />
                  <div className="w-3 h-3 bg-white rounded-full" />
                  <div className="ml-auto text-zinc-400 text-sm font-mono">KAI 1k System</div>
                </div>
                
                <div className="space-y-4">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="bg-gradient-to-r from-zinc-800/50 to-zinc-700/50 rounded-xl p-4 border border-zinc-600/30"
                  >
                                          <div className="flex items-center gap-3 mb-2">
                        <Network className="w-5 h-5 text-zinc-300" />
                        <span className="text-white font-semibold">KAI Network Active</span>
                      </div>
                    <p className="text-zinc-400 text-sm">Connected to 247 tools and systems...</p>
                    <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-white to-zinc-300"
                        animate={{ width: ["0%", "100%", "0%"] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      />
                    </div>
                  </motion.div>

                  <div className="space-y-2">
                    <div className="bg-black/20 rounded-lg p-3 border border-zinc-700/30">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-zinc-400 rounded-full" />
                        <span className="text-white text-sm">Workflow created</span>
                      </div>
                      <p className="text-zinc-400 text-xs">Auto-generated CRM pipeline in Salesforce</p>
                    </div>
                    
                    <div className="bg-black/20 rounded-lg p-3 border border-zinc-700/30">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-zinc-300 rounded-full" />
                        <span className="text-white text-sm">Learning adaptation</span>
                      </div>
                      <p className="text-zinc-400 text-xs">Optimized your communication style preferences</p>
                    </div>
                    
                    <div className="bg-black/20 rounded-lg p-3 border border-zinc-700/30">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-white rounded-full" />
                        <span className="text-white text-sm">Proactive execution</span>
                      </div>
                      <p className="text-zinc-400 text-xs">Scheduled follow-ups across 12 platforms</p>
                    </div>
                  </div>

                                      <div className="flex items-center justify-between pt-4 border-t border-zinc-700/50">
                      <span className="text-zinc-400 text-sm">1k Model Capacity</span>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-r from-zinc-300 to-white" />
                        </div>
                        <span className="text-zinc-300 text-sm font-semibold">Expanding</span>
                      </div>
                    </div>
                </div>
              </div>

              {/* Floating elements - Tech themed */}
              <motion.div
                animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-6 -right-6 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-2xl p-4 shadow-2xl border border-zinc-600"
              >
                <Network className="w-8 h-8 text-white" />
              </motion.div>

              <motion.div
                animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-gradient-to-r from-zinc-700 to-zinc-600 rounded-2xl p-4 shadow-2xl border border-zinc-500"
              >
                <Cpu className="w-8 h-8 text-white" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )

  // Problem/Solution Section - Teams vs KAI
  const ProblemSolution = () => (
    <section className="py-24 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl font-black text-zinc-900 dark:text-white mb-6">
            You're capable of more.
            <br />
            <span className="bg-gradient-to-r from-zinc-600 to-zinc-800 dark:from-zinc-400 dark:to-zinc-200 bg-clip-text text-transparent">
              KAI unlocks it.
            </span>
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-300 max-w-4xl mx-auto leading-relaxed">
            Imagine having an assistant that truly understands you, anticipates your needs, and empowers you to achieve things you never thought possible.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Problem Side - Traditional Teams */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800/50 dark:to-zinc-900/50 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-700/50 backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-200 mb-6">The Overwhelm is Real</h3>
              <div className="space-y-4">
                {[
                  { icon: "😵‍💫", text: "\"I'm drowning in tasks and losing track of everything\"" },
                  { icon: "🤦‍♂️", text: "\"I spend more time managing tools than getting work done\"" },
                  { icon: "😫", text: "\"I wish I had someone who truly understood my workflow\"" },
                  { icon: "🌪️", text: "\"I need help that actually anticipates what I need\"" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4 bg-white/70 dark:bg-zinc-800/30 rounded-xl p-4 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/30"
                  >
                    <span className="text-2xl grayscale">{item.icon}</span>
                    <p className="text-zinc-700 dark:text-zinc-300 italic">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Solution Side - KAI AGI */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="bg-gradient-to-br from-zinc-900 to-black dark:from-zinc-800 dark:to-zinc-900 rounded-3xl p-8 border border-zinc-700 shadow-2xl">
                            <h3 className="text-2xl font-bold text-white mb-6">Enter KAI: Your Proactive Assistant</h3>
              <div className="space-y-4">
                {[
                  { icon: <Network className="w-6 h-6 text-zinc-300" />, text: "Connects to all your tools and learns how you work" },
                  { icon: <Cpu className="w-6 h-6 text-zinc-400" />, text: "1k model understands your unique patterns and preferences" },
                  { icon: <Settings className="w-6 h-6 text-zinc-200" />, text: "Creates personalized workflows just by talking to it" },
                  { icon: <Rocket className="w-6 h-6 text-white" />, text: "Anticipates your needs and acts before you even ask" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4 bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50 backdrop-blur-sm"
                  >
                    <div className="p-2 bg-zinc-700 rounded-lg shadow-sm">
                      {item.icon}
                    </div>
                    <p className="text-zinc-200 font-medium">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )

  // How It Works - KAI Evolution
  const HowItWorks = () => {
    const steps = [
              {
          number: "01",
          title: "Deploy instantly",
          description: "KAI connects to your entire tech stack in minutes. No APIs, no integrations, no friction. Just pure 1k intelligence.",
          icon: Network
        },
      {
        number: "02", 
        title: "Learning acceleration",
        description: "The 1k model absorbs your company knowledge, processes, and preferences at superhuman speed.",
        icon: Brain
      },
      {
        number: "03",
        title: "Workflow automation",
        description: "Simply describe what you want. KAI creates complex multi-system workflows that adapt and improve over time.",
        icon: Settings
      },
              {
          number: "04",
          title: "Proactive execution",
          description: "KAI doesn't wait for commands. The 1k model anticipates needs and executes actions across your entire business ecosystem.",
          icon: Rocket
        }
    ]

    return (
      <section id="demo" className="py-24 bg-gradient-to-b from-black to-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-black text-white mb-6">
              How does KAI transform your capabilities?
            </h2>
            <p className="text-xl text-zinc-300 max-w-3xl mx-auto">
              KAI's 1k model doesn't just automate tasks—it understands you, learns from you, and empowers you to achieve extraordinary results.
            </p>
          </motion.div>

          <div className="relative">
            {/* Floating background elements */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-zinc-600 to-zinc-400 rounded-full opacity-20"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [-20, 20, -20],
                    x: [-10, 10, -10],
                    scale: [1, 1.5, 1],
                    opacity: [0.1, 0.3, 0.1]
                  }}
                  transition={{
                    duration: 4 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </div>

            <div className="relative grid lg:grid-cols-2 gap-16">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.8 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="bg-zinc-900/50 backdrop-blur-sm rounded-3xl p-8 border border-zinc-700/30 hover:bg-zinc-800/50 transition-all duration-300 shadow-2xl">
                    <div className="flex items-start gap-6">
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-800 to-zinc-700 shadow-2xl border border-zinc-600">
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-6xl font-black text-white/10">{step.number}</span>
                          <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                        </div>
                        <p className="text-zinc-300 text-lg leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Floating accent */}
                  <motion.div
                    animate={{ 
                      y: [-5, 5, -5],
                      rotate: [0, 2, -2, 0]
                    }}
                    transition={{ 
                      duration: 3 + index,
                      repeat: Infinity,
                      delay: index * 0.5
                    }}
                    className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-gradient-to-r from-zinc-600 to-zinc-500 shadow-lg"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Social Proof - KAI Adopters
  const SocialProof = () => {
    const testimonials = [
              {
          quote: "KAI transformed how I work. It anticipates what I need and handles complex tasks I never thought possible to automate.",
          author: "Sarah Martinez",
          role: "CEO",
          company: "TechFlow",
          avatar: "SM",
          rating: 5,
          highlight: "anticipates what I need"
        },
              {
          quote: "This isn't just automation - it's true intelligence. KAI thinks ahead and solves problems I didn't even know existed.",
          author: "David Chen",
          role: "CTO", 
          company: "ScaleWorks",
          avatar: "DC",
          rating: 5,
          highlight: "true intelligence"
        },
              {
          quote: "KAI is like having the perfect assistant who knows exactly what I need before I do. It's revolutionized my productivity.",
          author: "Emily Rodriguez",
          role: "VP Operations",
          company: "FlowCorp",
          avatar: "ER",
          rating: 5,
          highlight: "knows exactly what I need before I do"
        }
    ]

    return (
      <section className="py-24 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
                          <div className="flex items-center justify-center gap-2 mb-6">
                <Cpu className="w-8 h-8 text-zinc-600 dark:text-zinc-400" />
                <h2 className="text-4xl font-black text-zinc-900 dark:text-white">
                  Early KAI adopters love the results
                </h2>
              </div>
              <p className="text-zinc-600 dark:text-zinc-300 text-xl">
                Join the companies already operating with 1k-powered workflows
              </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                className="relative group"
              >
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-zinc-700 hover:shadow-3xl transition-all duration-300 group-hover:scale-105 backdrop-blur-sm">
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-zinc-400 fill-current" />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-zinc-700 dark:text-zinc-300 text-lg leading-relaxed mb-8">
                    "{testimonial.quote.split(testimonial.highlight)[0]}
                    <span className="bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent font-bold">
                      {testimonial.highlight}
                    </span>
                    {testimonial.quote.split(testimonial.highlight)[1]}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-zinc-800 to-zinc-700 dark:from-zinc-700 dark:to-zinc-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white">{testimonial.author}</p>
                      <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                        {testimonial.company}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating accent */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-zinc-700 to-zinc-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </div>

          {/* Stats - AGI Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            viewport={{ once: true }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { number: "2,847", label: "Professionals", icon: Users },
              { number: "247", label: "Connected Tools", icon: Network },
              { number: "89%", label: "More Productive", icon: TrendingUp },
              { number: "1k", label: "AI Model", icon: Cpu }
            ].map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="p-3 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-2xl shadow-lg">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-black text-zinc-900 dark:text-white mb-2">{stat.number}</div>
                <div className="text-zinc-600 dark:text-zinc-400 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    )
  }

  // FAQ - KAI Questions
  const FAQSection = () => {
    const faqs = [
      {
        question: "Is KAI actually intelligent, or just another automation tool?",
        answer: "KAI represents the first practical implementation of proactive AI. Our proprietary 1k model doesn't just follow rules—it learns, adapts, and makes decisions across domains like a human would, but with the processing power of a supercomputer."
      },
      {
        question: "How is this different from Zapier or other workflow tools?",
        answer: "Traditional tools require you to build workflows step-by-step. KAI creates complex multi-system workflows through conversation. Just describe what you want, and the 1k model figures out how to make it happen across all your tools."
      },
              {
          question: "What does the '1k' model name mean?",
          answer: "1k is our proprietary AI model—the first incarnation of proactive artificial intelligence designed for business. It can learn and operate across virtually any domain or tool, adapting to your specific needs and workflows."
        },
              {
          question: "Can KAI really handle complex work for me?",
          answer: "Absolutely. KAI doesn't replace your creativity or decision-making, but it can handle incredibly complex execution work. It learns your unique patterns, connects to all your tools, and manages workflows that would normally require significant time and effort."
        },
              {
          question: "How secure is it to give KAI access to our systems?",
          answer: "KAI operates with enterprise-grade security. It accesses only what you authorize and can be configured with detailed permission controls. The 1k model processes everything locally within your security perimeter."
        }
    ]

    return (
      <section className="py-24 bg-gradient-to-b from-zinc-50 to-white dark:from-black dark:to-zinc-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-black text-zinc-900 dark:text-white mb-6">
              Questions about KAI? We've got answers.
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-300">
              Everything you want to know about deploying the 1k model
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="font-bold text-zinc-900 dark:text-white text-lg pr-8">
                    {faq.question}
                  </span>
                  <ChevronDown className={`w-6 h-6 text-zinc-500 transition-transform duration-300 ${
                    openFaq === index ? 'rotate-180' : ''
                  }`} />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === index ? "auto" : 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-8 pb-6">
                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-lg">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Epic Final CTA - KAI Revolution
  const FinalCTA = () => (
    <section className="py-24 bg-gradient-to-br from-black via-zinc-900 to-black relative overflow-hidden">
      {/* Subtle background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.03),transparent_50%)]" />
      </div>
      
      <div className="relative max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <h2 className="text-5xl sm:text-6xl font-black text-white leading-tight">
            Ready to deploy
            <br />
            <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              the 1k model?
            </span>
          </h2>
          
          <p className="text-2xl text-zinc-300 max-w-3xl mx-auto leading-relaxed">
            Join the KAI revolution. Experience what it's like to have an assistant that truly understands and empowers you.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-white to-zinc-200 hover:from-zinc-100 hover:to-zinc-300 text-black px-16 py-8 text-2xl font-bold rounded-3xl shadow-2xl hover:shadow-white/10 transition-all duration-300 transform hover:scale-105"
              onClick={() => window.location.href = "/auth?mode=signup"}
            >
              <Cpu className="mr-4 w-8 h-8" />
              Deploy KAI 1k Model
              <ArrowRight className="ml-4 w-8 h-8" />
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            viewport={{ once: true }}
            className="pt-8 text-zinc-400"
          >
            <p className="text-lg mb-4">No credit card • Enterprise security • Scales with your business</p>
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>SOC2 compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                <span>247+ tool integrations</span>
              </div>
                              <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  <span>1k model</span>
                </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="pt-16">
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <SocialProof />
        <FAQSection />
        <FinalCTA />
      </div>
    </div>
  )
} 