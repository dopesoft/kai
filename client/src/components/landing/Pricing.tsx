import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Check, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { landingContent } from "@/lib/content"

const bgDark = "bg-[#0d0d0d]"
const cardDark = "bg-[#131313]"
const neon = "#00e0ff"

interface PricingProps {
  onSignupClick: () => void
}

export function Pricing({ onSignupClick }: PricingProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  const { pricing } = landingContent

  return (
    <section id="pricing" ref={ref} className={`py-24 ${bgDark}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-pixel text-3xl sm:text-4xl lg:text-5xl mb-4" style={{color: neon}}>
            {pricing.title}
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Choose the plan that fits your needs. Start free, upgrade when you're ready.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricing.plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.2,
                ease: "easeOut"
              }}
              className={`relative ${plan.highlighted ? 'md:-mt-8' : ''}`}
            >
              {/* Highlight badge for Pro plan */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className={`h-full border-2 p-8 transition-all duration-300 ${
                plan.highlighted
                  ? `${cardDark} scale-105` : cardDark
              }`} style={{borderColor: plan.highlighted ? neon : '#1e1e1e'}}>
                {/* Plan header */}
                <div className="text-center mb-8">
                  <h3 className="font-pixel text-xl mb-2" style={{color: neon}}>
                    {plan.name}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className="font-pixel text-4xl" style={{color: '#f1f1f1'}}>
                      {plan.price}
                    </span>
                    {plan.price !== "Free" && (
                      <span className="text-muted-foreground ml-1">/month</span>
                    )}
                  </div>
                </div>

                {/* Features list */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-muted-foreground leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                <Button
                  size="lg"
                  onClick={onSignupClick}
                  className="w-full font-pixel tracking-wide" style={{backgroundColor: neon, color: '#0d0d0d'}}
                >
                  {plan.cta}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-gray-400">
            All plans include 24/7 support and a 30-day money-back guarantee.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            No setup fees. Cancel anytime.
          </p>
        </motion.div>
      </div>
    </section>
  )
} 