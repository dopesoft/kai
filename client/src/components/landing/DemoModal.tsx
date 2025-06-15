import { motion, AnimatePresence } from "framer-motion"
import { X, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-4xl backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-100 mb-2">
                    KAI in Action
                  </h2>
                  <p className="text-gray-400">
                    See how KAI transforms your productivity in 60 seconds
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-100 hover:bg-white/10"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Video content */}
              <div className="p-6">
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-600/20" />
                  
                  {/* Placeholder for actual video */}
                  <div className="relative z-10 text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                      <Play className="w-10 h-10 text-white ml-1" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-100 mb-2">
                      Demo Video Coming Soon
                    </h3>
                    <p className="text-gray-400 mb-6">
                      We're putting the finishing touches on our demo video.
                    </p>
                    
                    {/* Feature highlights */}
                    <div className="grid md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
                      <div className="backdrop-blur-sm bg-white/5 rounded-lg p-4">
                        <h4 className="text-cyan-400 font-medium mb-2">Memory System</h4>
                        <p className="text-gray-300 text-sm">
                          Watch KAI remember context across conversations
                        </p>
                      </div>
                      <div className="backdrop-blur-sm bg-white/5 rounded-lg p-4">
                        <h4 className="text-blue-400 font-medium mb-2">Proactive Actions</h4>
                        <p className="text-gray-300 text-sm">
                          See KAI anticipate needs and take action
                        </p>
                      </div>
                      <div className="backdrop-blur-sm bg-white/5 rounded-lg p-4">
                        <h4 className="text-purple-400 font-medium mb-2">Integrations</h4>
                        <p className="text-gray-300 text-sm">
                          Experience seamless workflow integration
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Animated elements */}
                  <motion.div
                    className="absolute top-4 left-4 w-3 h-3 bg-cyan-400 rounded-full"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute top-8 right-8 w-2 h-2 bg-purple-500 rounded-full"
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute bottom-6 left-12 w-2 h-2 bg-blue-400 rounded-full"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    size="lg"
                    onClick={onClose}
                    className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 hover:from-cyan-500 hover:via-blue-600 hover:to-purple-700 text-white border-0"
                  >
                    Get Early Access
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={onClose}
                    className="border-white/20 text-gray-100 hover:bg-white/10"
                  >
                    Notify Me When Ready
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
} 