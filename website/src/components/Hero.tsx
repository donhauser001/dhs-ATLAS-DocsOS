import { motion } from 'framer-motion'
import { ArrowDown, Sparkles } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-ink-950/95 to-ink-950" />
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-600/5 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(212, 168, 74, 0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(212, 168, 74, 0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold-500/30 bg-gold-500/5 mb-8"
        >
          <Sparkles className="w-4 h-4 text-gold-400" />
          <span className="text-sm text-gold-300">专业设计服务</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-tight mb-8"
        >
          <span className="text-ink-100">让设计</span>
          <br />
          <span className="text-gradient">讲述品牌故事</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-ink-400 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          我们是一家专注于品牌视觉的设计工作室
          <br className="hidden sm:block" />
          以独特的视角，创造令人难忘的品牌体验
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#works"
            className="group px-8 py-4 bg-gold-500 text-ink-950 font-medium rounded-full hover:bg-gold-400 transition-all duration-300 hover:shadow-lg hover:shadow-gold-500/25"
          >
            查看作品集
          </a>
          <a
            href="#contact"
            className="px-8 py-4 border border-ink-700 text-ink-200 font-medium rounded-full hover:border-gold-500/50 hover:text-gold-400 transition-all duration-300"
          >
            预约咨询
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
        >
          {[
            { value: '200+', label: '服务客户' },
            { value: '15+', label: '年设计经验' },
            { value: '98%', label: '客户满意度' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl md:text-4xl text-gold-400 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-ink-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <a
          href="#services"
          className="flex flex-col items-center gap-2 text-ink-500 hover:text-gold-400 transition-colors"
        >
          <span className="text-xs tracking-widest uppercase">探索更多</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowDown className="w-5 h-5" />
          </motion.div>
        </a>
      </motion.div>
    </section>
  )
}

