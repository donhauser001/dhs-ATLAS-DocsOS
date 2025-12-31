import { motion } from 'framer-motion'
import { Palette, Box, Layout, Globe, Megaphone, FileText } from 'lucide-react'

const services = [
  {
    icon: Palette,
    title: '品牌设计',
    description: 'Logo设计、VI系统、品牌策略，打造独特的品牌识别体系',
  },
  {
    icon: Box,
    title: '包装设计',
    description: '产品包装、礼盒设计、系列包装，让产品在货架上脱颖而出',
  },
  {
    icon: Layout,
    title: '画册设计',
    description: '企业画册、产品手册、年报设计，传递品牌价值与故事',
  },
  {
    icon: Globe,
    title: '网站设计',
    description: 'UI/UX设计、网站建设、交互设计，打造数字化品牌体验',
  },
  {
    icon: Megaphone,
    title: '营销物料',
    description: '海报、展架、宣传单页，全方位支持品牌营销活动',
  },
  {
    icon: FileText,
    title: '文档设计',
    description: 'PPT模板、Word模板、信纸信封，统一品牌办公形象',
  },
]

export function Services() {
  return (
    <section id="services" className="py-32 bg-ink-900/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-20">
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-gold-400 text-sm tracking-widest uppercase mb-4 block"
          >
            我们的服务
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-5xl text-ink-100 mb-6"
          >
            全方位设计服务
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-ink-400 leading-relaxed"
          >
            从品牌战略到视觉落地，我们提供一站式设计解决方案，
            帮助企业建立完整的品牌视觉体系
          </motion.p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative p-8 rounded-2xl border border-ink-800/50 bg-ink-900/50 hover:border-gold-500/30 hover:bg-ink-900 transition-all duration-500"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 flex items-center justify-center mb-6 group-hover:from-gold-500/30 group-hover:to-gold-600/20 transition-all duration-500">
                <service.icon className="w-6 h-6 text-gold-400" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-medium text-ink-100 mb-3 group-hover:text-gold-400 transition-colors duration-300">
                {service.title}
              </h3>
              <p className="text-ink-400 leading-relaxed">
                {service.description}
              </p>

              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-gold-500/30 rounded-tr-lg" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

