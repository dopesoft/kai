import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Brain, Zap, BarChart3, Users } from "lucide-react"
import { Scene3D } from "@/components/ui/Scene3D"

interface DemoOption {
  title: string
  description: string
  icon: any
  items: string[]
}

export function DemoOptions() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const demoOptions: DemoOption[] = [
    {
      title: "Memory Development",
      description: "Explore intelligent memory systems",
      icon: Brain,
      items: [
        "Persistent conversation memory",
        "Context-aware AI responses", 
        "Personal knowledge graphs",
        "Cross-session continuity"
      ]
    },
    {
      title: "Workflow Automation",
      description: "Your productivity, our intelligence",
      icon: Zap,
      items: [
        "Automated task management",
        "Intelligent scheduling",
        "Proactive notifications",
        "Smart integrations"
      ]
    },
    {
      title: "Analytics & Insights",
      description: "Data and performance visualization",
      icon: BarChart3,
      items: [
        "Memory usage analytics", 
        "Productivity metrics",
        "Interaction patterns",
        "Performance optimization"
      ]
    },
    {
      title: "Team Collaboration",
      description: "Connect with your team",
      icon: Users,
      items: [
        "Shared memory spaces",
        "Team knowledge bases",
        "Collaborative workflows",
        "Multi-user environments"
      ]
    }
  ]

  return (
    <section ref={ref} className="py-24 bg-gradient-to-b from-gray-950 via-black to-gray-950 relative overflow-hidden">
      {/* 3D Scene Background */}
      <div className="absolute inset-0 opacity-30">
        <Scene3D compact={true} />
      </div>
      
      {/* Dynamic background effects */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.15, 0.05],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/15 to-purple-500/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.05, 0.1, 0.05],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 rounded-full blur-3xl"
        />
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.h2 
            className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-cyan-100 mb-4"
            whileInView={{ scale: [0.98, 1] }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Explore the ways KAI can enhance your operations
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-300 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Choose your demonstration pathway to see how KAI's memory platform transforms your workflow.
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {demoOptions.map((option, index) => {
            const IconComponent = option.icon
            const isSelected = selectedOption === option.title
            
            return (
              <motion.div
                key={option.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.02, 
                  y: -8,
                  boxShadow: isSelected 
                    ? "0 25px 50px -12px rgba(59, 130, 246, 0.4)"
                    : "0 25px 50px -12px rgba(59, 130, 246, 0.2)"
                }}
                className={`relative bg-gradient-to-br from-gray-900/80 to-black/60 border rounded-xl p-6 cursor-pointer transition-all duration-500 backdrop-blur-sm overflow-hidden ${
                  isSelected 
                    ? 'border-blue-400 bg-blue-950/30' 
                    : 'border-gray-700 hover:border-blue-500/50'
                }`}
                onClick={() => setSelectedOption(isSelected ? null : option.title)}
              >
                {/* Hover glow effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 transition-opacity duration-500"
                  animate={{ opacity: isSelected ? 0.3 : 0 }}
                  whileHover={{ opacity: 0.2 }}
                />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <motion.div 
                      className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <IconComponent className="w-5 h-5 text-white" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-100 transition-colors duration-300">
                      {option.title}
                    </h3>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-4 group-hover:text-gray-300 transition-colors duration-300">
                    {option.description}
                  </p>
                </div>

                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-700 pt-4"
                  >
                    <ul className="space-y-2">
                      {option.items.map((item, itemIndex) => (
                        <motion.li
                          key={itemIndex}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: itemIndex * 0.1 }}
                          className="flex items-center text-sm text-gray-300"
                        >
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 flex-shrink-0" />
                          {item}
                        </motion.li>
                      ))}
                    </ul>
                    
                    <Button
                      size="sm"
                      className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Request Demo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* General contact form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          whileHover={{ scale: 1.01, y: -5 }}
          className="relative bg-gradient-to-br from-gray-900/80 to-black/60 border border-gray-700 rounded-xl p-8 text-center backdrop-blur-sm overflow-hidden"
        >
          {/* Background glow */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          <div className="relative z-10">
            <motion.h3 
              className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-100 mb-4"
              whileInView={{ scale: [0.98, 1] }}
              transition={{ duration: 0.3 }}
              viewport={{ once: true }}
            >
              Ready to see KAI in action?
            </motion.h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Schedule a personalized demonstration to see how KAI's memory platform can transform your workflow.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 px-8 py-3 font-semibold"
              >
                Schedule Demonstration
                <motion.div
                  className="ml-2 inline-block"
                  whileHover={{ x: 3 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <ArrowRight className="h-5 w-5" />
                </motion.div>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 