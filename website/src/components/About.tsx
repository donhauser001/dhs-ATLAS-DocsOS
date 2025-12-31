import { motion } from 'framer-motion'
import { Award, Users, Target, Heart } from 'lucide-react'

const values = [
  {
    icon: Target,
    title: '专注品质',
    description: '每一个项目都全力以赴，追求设计的极致品质',
  },
  {
    icon: Heart,
    title: '用心服务',
    description: '深入理解客户需求，提供真正有价值的设计解决方案',
  },
  {
    icon: Users,
    title: '紧密协作',
    description: '与客户保持密切沟通，确保设计成果符合预期',
  },
  {
    icon: Award,
    title: '持续创新',
    description: '紧跟设计趋势，不断探索新的视觉表达方式',
  },
]

export function About() {
  return (
    <section id="about" className="py-32 bg-ink-900/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Image/Visual */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=1000&fit=crop"
                alt="工作室"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-8 -right-8 lg:-right-12 bg-ink-950 border border-ink-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                  <span className="font-display text-2xl text-ink-950">15</span>
                </div>
                <div>
                  <div className="text-2xl font-display text-ink-100">年</div>
                  <div className="text-sm text-ink-400">设计经验</div>
                </div>
              </div>
            </div>
            {/* Decorative */}
            <div className="absolute -top-4 -left-4 w-24 h-24 border border-gold-500/20 rounded-2xl -z-10" />
          </motion.div>

          {/* Right: Content */}
          <div>
            <motion.span
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-gold-400 text-sm tracking-widest uppercase mb-4 block"
            >
              关于我们
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl md:text-5xl text-ink-100 mb-6"
            >
              用设计创造价值
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-4 text-ink-400 leading-relaxed mb-12"
            >
              <p>
                Donhauser 是一家专注于品牌视觉设计的创意工作室，
                成立于2010年。我们相信优秀的设计能够传递品牌价值、
                触动人心、推动商业成功。
              </p>
              <p>
                在过去十五年里，我们为超过200家企业提供了专业的设计服务，
                涵盖品牌设计、包装设计、网站设计等多个领域，
                积累了丰富的行业经验。
              </p>
            </motion.div>

            {/* Values */}
            <div className="grid sm:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                    <value.icon className="w-5 h-5 text-gold-400" />
                  </div>
                  <div>
                    <h4 className="text-ink-100 font-medium mb-1">{value.title}</h4>
                    <p className="text-sm text-ink-500">{value.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

