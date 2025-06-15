import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { landingContent } from "@/lib/content"

export function SocialProof() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const { socialProof } = landingContent

  return (
    <section ref={ref} className="py-16 bg-muted/30 backdrop-blur-sm border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-gray-400 text-sm font-medium tracking-wide uppercase mb-8">
            {socialProof.title}
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
            {socialProof.logos.map((logo, index) => (
              <motion.div
                key={logo.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                className="flex items-center justify-center"
              >
                {/* Placeholder for company logos */}
                <div className="w-24 h-12 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100">
                  <span className="text-gray-300 text-xs font-semibold">
                    {logo.name}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
} 