import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion"
import { landingContent } from "@/lib/content"

export function FAQ() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  const { faq } = landingContent

  return (
    <section ref={ref} className="py-24 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-100 mb-4">
            Frequently asked
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              {" "}questions
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Everything you need to know about KAI. Can't find the answer you're looking for?
            {" "}
            <a 
              href="mailto:support@gokai.ai" 
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Reach out to our team
            </a>
            .
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="backdrop-blur-xl bg-card border border-border rounded-2xl p-8 shadow-xl"
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faq.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              >
                <AccordionItem 
                  value={`item-${index}`}
                  className="border border-border rounded-xl backdrop-blur-sm bg-muted px-6"
                >
                  <AccordionTrigger className="text-left text-lg font-semibold text-foreground hover:text-primary transition-colors py-6 hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-gray-100 mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-400 mb-6">
              Our team is here to help you get the most out of KAI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:support@gokai.ai"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 hover:from-cyan-500 hover:via-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Contact Support
              </a>
              <a 
                href="/docs"
                className="inline-flex items-center justify-center px-6 py-3 bg-white/10 hover:bg-white/20 text-gray-100 font-medium rounded-lg border border-white/20 hover:border-white/30 transition-all duration-300"
              >
                Browse Documentation
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 