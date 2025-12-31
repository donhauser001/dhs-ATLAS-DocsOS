import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

const works = [
  {
    id: 1,
    title: '茗香茶业',
    category: '品牌设计',
    description: '传统茶文化与现代美学的完美融合',
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&h=600&fit=crop',
    color: 'from-emerald-500/20 to-emerald-600/10',
  },
  {
    id: 2,
    title: '云端科技',
    category: '网站设计',
    description: '科技企业的数字化品牌升级',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    color: 'from-blue-500/20 to-blue-600/10',
  },
  {
    id: 3,
    title: '悦味食品',
    category: '包装设计',
    description: '健康食品的活力视觉表达',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
    color: 'from-orange-500/20 to-orange-600/10',
  },
  {
    id: 4,
    title: '璞真酒店',
    category: '品牌设计',
    description: '高端酒店的东方雅致',
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&h=600&fit=crop',
    color: 'from-amber-500/20 to-amber-600/10',
  },
]

export function Works() {
  return (
    <section id="works" className="py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
          <div className="max-w-2xl mb-8 md:mb-0">
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-gold-400 text-sm tracking-widest uppercase mb-4 block"
            >
              精选作品
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl md:text-5xl text-ink-100"
            >
              我们的设计实践
            </motion.h2>
          </div>
          <motion.a
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            href="#"
            className="group flex items-center gap-2 text-ink-300 hover:text-gold-400 transition-colors"
          >
            <span>查看全部作品</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </motion.a>
        </div>

        {/* Works Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {works.map((work, index) => (
            <motion.a
              key={work.id}
              href="#"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative block rounded-2xl overflow-hidden bg-ink-900/50"
            >
              {/* Image */}
              <div className="aspect-[4/3] overflow-hidden">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${work.color} z-10`}
                />
                <img
                  src={work.image}
                  alt={work.title}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end bg-gradient-to-t from-ink-950/90 via-ink-950/50 to-transparent">
                <span className="text-gold-400 text-sm mb-2">{work.category}</span>
                <h3 className="font-display text-2xl md:text-3xl text-ink-100 mb-2 group-hover:text-gold-400 transition-colors">
                  {work.title}
                </h3>
                <p className="text-ink-400 text-sm">{work.description}</p>

                {/* Arrow indicator */}
                <div className="absolute top-6 right-6 w-12 h-12 rounded-full border border-ink-100/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowUpRight className="w-5 h-5 text-ink-100" />
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}

