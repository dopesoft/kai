import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Twitter, Github, MessageCircle, ExternalLink } from "lucide-react"
import { landingContent } from "@/lib/content"

const socialIconMap = {
  Twitter,
  Github,
  MessageCircle
}

export function Footer() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const { footer } = landingContent

  return (
    <footer ref={ref} className="py-16 bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Left - Logo and tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-2xl font-bold text-gray-100">GoKAI.ai</span>
            </div>
            <p className="text-gray-400 leading-relaxed max-w-sm">
              {footer.tagline}
            </p>
          </motion.div>

          {/* Center - Quick links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-gray-100">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href={footer.links.docs}
                  className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center"
                >
                  Documentation
                  <ExternalLink className="ml-1 w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href={footer.links.status}
                  className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center"
                >
                  System Status
                  <ExternalLink className="ml-1 w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href={footer.links.blog}
                  className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center"
                >
                  Blog
                  <ExternalLink className="ml-1 w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="/privacy"
                  className="text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="/terms"
                  className="text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Right - Social icons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-gray-100">Connect</h3>
            <div className="flex space-x-4">
              {footer.social.map((social, index) => {
                const IconComponent = socialIconMap[social.icon as keyof typeof socialIconMap]
                return (
                  <motion.a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-lg flex items-center justify-center text-gray-400 hover:text-cyan-400 transition-all duration-300"
                    aria-label={social.name}
                  >
                    <IconComponent className="w-5 h-5" />
                  </motion.a>
                )
              })}
            </div>
            
            <div className="mt-8">
              <p className="text-gray-500 text-sm mb-2">
                Join our newsletter for updates
              </p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-l-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
                <button className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white rounded-r-lg transition-all duration-300">
                  Subscribe
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center"
        >
          <p className="text-gray-500 text-sm">
            {footer.copyright}
          </p>
          <p className="text-gray-500 text-sm mt-2 md:mt-0">
            {footer.madeBy}
          </p>
        </motion.div>
      </div>
    </footer>
  )
} 