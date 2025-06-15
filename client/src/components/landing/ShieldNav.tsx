import { motion } from "framer-motion"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

export function ShieldNav() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const navItems = [
    {
      title: "Memory Platform",
      items: [
        { name: "EdgeOS", desc: "Runtime environment" },
        { name: "Memory Core", desc: "Persistent knowledge system" },
        { name: "Workflow Engine", desc: "Task automation" },
        { name: "Integration Hub", desc: "Connect everything" }
      ]
    },
    {
      title: "AI & Productivity", 
      items: [
        { name: "Smart Chat", desc: "Context-aware conversations" },
        { name: "Memory Graphs", desc: "Knowledge visualization" },
        { name: "Task Automation", desc: "Intelligent workflows" }
      ]
    },
    {
      title: "Company",
      items: [
        { name: "About Us", desc: "Our story" },
        { name: "Our Team", desc: "Brilliant people" },
        { name: "Careers", desc: "Join us" }
      ]
    }
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            className="flex items-center cursor-pointer"
          >
            <motion.div 
              className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3 shadow-lg"
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <span className="text-white font-bold text-lg">K</span>
            </motion.div>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-100 font-bold text-xl">KAI</span>
          </motion.div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
                onMouseEnter={() => setActiveDropdown(item.title)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center text-sm font-medium">
                  {item.title}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                
                {/* Dropdown */}
                {activeDropdown === item.title && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                  >
                    {item.items.map((subItem) => (
                      <a
                        key={subItem.name}
                        href="#"
                        className="block px-4 py-3 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="text-foreground font-medium text-sm mb-1">
                          {subItem.name}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {subItem.desc}
                        </div>
                      </a>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 font-medium"
            >
              Schedule a Demonstration
            </Button>
          </motion.div>
        </div>
      </div>
    </nav>
  )
} 