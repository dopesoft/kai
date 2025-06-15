import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { landingContent } from "@/lib/content"
import { Scene3D } from "@/components/ui/Scene3D"

interface ShieldHeroProps {
  onLearnMore: () => void
}

export function ShieldHero({ onLearnMore }: ShieldHeroProps) {
  const { hero } = landingContent

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-900 text-white overflow-hidden">
      {/* 3D Scene Background */}
      <div className="absolute inset-0 opacity-60">
        <Scene3D />
      </div>
      
      {/* Dynamic animated background overlay */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.2, 0.05],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
          className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl"
        />
        
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/70 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
        
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:100px_100px] opacity-40" />
        
        {/* Dark overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        {/* Top tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <p className="text-lg text-gray-300 font-light tracking-wide">
            {hero.tagline}
          </p>
        </motion.div>

        {/* Main title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-12"
        >
          <motion.h1 
            className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-none bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {hero.title}
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            {hero.description}
          </motion.p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mb-16"
        >
          <Button
            onClick={onLearnMore}
            variant="outline"
            size="lg"
            className="border-gray-600 text-white hover:bg-white hover:text-black transition-all duration-300 px-8 py-3 text-lg font-medium"
          >
            {hero.subtitle}
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        {/* Platform showcase section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="relative"
        >
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 lg:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                Memory Platform
              </h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                The AI-powered, modular memory software platform for rapid development and deployment to intelligent workflows.
              </p>
            </div>

            {/* Three key benefits */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {landingContent.platforms[0].features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                  className="text-center"
                >
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Component grid - enhanced with visual flair */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {landingContent.platforms[0].components.map((component, index) => (
                <motion.div
                  key={component.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                  whileHover={{ 
                    scale: 1.02, 
                    y: -5,
                    boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.25)"
                  }}
                  className="relative bg-gradient-to-br from-black/60 to-gray-900/40 border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-500 group overflow-hidden backdrop-blur-sm"
                >
                  {/* Hover glow effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    initial={false}
                  />
                  
                  {/* Content */}
                  <div className="relative z-10 mb-6">
                    <motion.h4 
                      className="text-sm font-semibold text-blue-300 mb-2 tracking-wide"
                      whileHover={{ color: "#60a5fa" }}
                    >
                      [{component.name.toUpperCase()}]
                    </motion.h4>
                    <h3 className="text-lg font-bold text-white mb-3 leading-tight group-hover:text-blue-50 transition-colors duration-300">
                      {component.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4 group-hover:text-gray-300 transition-colors duration-300">
                      {component.description}
                    </p>
                  </div>
                  
                  {/* CTA with animated arrow */}
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="relative z-10"
                  >
                    <Button
                      variant="link"
                      className="text-blue-400 hover:text-blue-300 p-0 h-auto font-medium text-sm group-hover:underline"
                    >
                      {component.cta}
                      <motion.span
                        className="inline-block ml-1"
                        whileHover={{ x: 2 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        →
                      </motion.span>
                    </Button>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Bottom CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="text-center mt-12 pt-8 border-t border-gray-700"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                {landingContent.cta.title}
              </h3>
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-200 transition-colors duration-300 px-8 py-3 text-lg font-semibold"
              >
                {landingContent.cta.button}
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom mission statement */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="text-center mt-16"
        >
          <p className="text-lg text-gray-300 font-light max-w-2xl mx-auto mb-8">
            {landingContent.company.mission}
          </p>
          <div className="flex justify-center space-x-4">
            {landingContent.company.ctas.map((cta, index) => (
              <Button
                key={cta}
                variant="outline"
                className="border-gray-600 text-white hover:bg-white hover:text-black transition-all duration-300"
              >
                {cta}
              </Button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
} 