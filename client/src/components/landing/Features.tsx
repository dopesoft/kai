import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Brain, Zap, Link, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { landingContent } from "@/lib/content"

const iconMap = {
  Brain,
  Zap,
  Link
}

export function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null)
  const { features } = landingContent

  const toggleFeature = (index: number) => {
    setExpandedFeature(expandedFeature === index ? null : index)
  }

  return (
    <section ref={ref} className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Enterprise-grade capabilities
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Deploy autonomous AI systems with mission-critical reliability and 
            enterprise-level security across your entire operation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon as keyof typeof iconMap]
            const isExpanded = expandedFeature === index

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.2,
                  ease: "easeOut"
                }}
                whileHover={{ y: -8 }}
                className="group"
              >
                <div className="h-full bg-card border border-border rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                    <IconComponent className="w-8 h-8 text-primary-foreground" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    {feature.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Learn more button */}
                  <Button
                    variant="ghost"
                    onClick={() => toggleFeature(index)}
                    className="text-primary hover:text-primary/80 hover:bg-primary/10 p-0 h-auto font-medium"
                  >
                    Learn more
                    {isExpanded ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </Button>

                  {/* Expandable details */}
                  <motion.div
                    initial={false}
                    animate={{ 
                      height: isExpanded ? "auto" : 0,
                      opacity: isExpanded ? 1 : 0 
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-border">
                      <ul className="space-y-2">
                        {feature.details.map((detail, detailIndex) => (
                          <motion.li
                            key={detailIndex}
                            initial={{ opacity: 0, x: -10 }}
                            animate={isExpanded ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                            transition={{ duration: 0.2, delay: detailIndex * 0.1 }}
                            className="flex items-start"
                          >
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-muted-foreground text-sm">{detail}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
} 