import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import { useState } from 'react'

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log(formData)
  }

  return (
    <section id="contact" className="py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left: Contact Info */}
          <div>
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-gold-400 text-sm tracking-widest uppercase mb-4 block"
            >
              联系我们
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl md:text-5xl text-ink-100 mb-6"
            >
              开始您的设计之旅
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-ink-400 leading-relaxed mb-12"
            >
              无论您有什么设计需求，我们都期待与您交流。
              填写表单或直接联系我们，开启品牌升级之旅。
            </motion.p>

            {/* Contact Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <a
                href="mailto:hello@donhauser.design"
                className="flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center group-hover:bg-gold-500/20 transition-colors">
                  <Mail className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <div className="text-sm text-ink-500 mb-0.5">邮箱</div>
                  <div className="text-ink-200 group-hover:text-gold-400 transition-colors">
                    hello@donhauser.design
                  </div>
                </div>
              </a>

              <a href="tel:+8613800138000" className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center group-hover:bg-gold-500/20 transition-colors">
                  <Phone className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <div className="text-sm text-ink-500 mb-0.5">电话</div>
                  <div className="text-ink-200 group-hover:text-gold-400 transition-colors">
                    138 0013 8000
                  </div>
                </div>
              </a>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <div className="text-sm text-ink-500 mb-0.5">地址</div>
                  <div className="text-ink-200">上海市静安区南京西路1266号</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <form
              onSubmit={handleSubmit}
              className="bg-ink-900/50 border border-ink-800/50 rounded-2xl p-8"
            >
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-ink-400 mb-2">姓名</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-ink-950 border border-ink-800 rounded-xl text-ink-100 placeholder-ink-600 focus:border-gold-500/50 focus:outline-none transition-colors"
                      placeholder="您的姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-ink-400 mb-2">邮箱</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-ink-950 border border-ink-800 rounded-xl text-ink-100 placeholder-ink-600 focus:border-gold-500/50 focus:outline-none transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-ink-400 mb-2">公司</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 bg-ink-950 border border-ink-800 rounded-xl text-ink-100 placeholder-ink-600 focus:border-gold-500/50 focus:outline-none transition-colors"
                    placeholder="公司名称（选填）"
                  />
                </div>

                <div>
                  <label className="block text-sm text-ink-400 mb-2">项目需求</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3 bg-ink-950 border border-ink-800 rounded-xl text-ink-100 placeholder-ink-600 focus:border-gold-500/50 focus:outline-none transition-colors resize-none"
                    placeholder="请简要描述您的设计需求..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gold-500 text-ink-950 font-medium rounded-xl hover:bg-gold-400 transition-colors flex items-center justify-center gap-2"
                >
                  <span>发送消息</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

