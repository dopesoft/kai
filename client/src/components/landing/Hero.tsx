import { motion } from "framer-motion"
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { landingContent } from "@/lib/content"

interface HeroProps {
  onDemoClick: () => void
  onSignupClick: () => void
}

export function Hero({ onDemoClick, onSignupClick }: HeroProps) {
  const { hero } = landingContent

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Professional background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="uppercase text-sm tracking-widest text-primary font-medium mb-4"
            >
              {hero.tagline}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight"
            >
              {hero.title}
              <br />
              <span className="text-muted-foreground">
                {hero.subtitle}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0"
            >
              {hero.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                size="lg"
                onClick={onSignupClick}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-8 py-4 h-auto"
              >
                {hero.ctaPrimary}
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={onDemoClick}
                className="border-border text-foreground hover:bg-muted transition-all duration-300 text-lg px-8 py-4 h-auto"
              >
                <Play className="mr-2 h-5 w-5" />
                {hero.ctaSecondary}
              </Button>
            </motion.div>
          </motion.div>

          {/* Right column - Platform showcase */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative bg-card border border-border rounded-xl p-8 shadow-lg">
              {/* Platform interface mockup */}
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <span className="text-primary-foreground font-bold text-xl">KAI</span>
                  </div>
                  <p className="text-foreground text-lg font-medium">Enterprise Platform</p>
                  <p className="text-muted-foreground text-sm">Autonomous AI Operations</p>
                </div>
                
                {/* Subtle grid pattern */}
                <div className="absolute inset-0 bg-grid-small opacity-30" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 