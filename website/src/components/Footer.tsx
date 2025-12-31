import { motion } from 'framer-motion'

const footerLinks = {
  services: [
    { label: '品牌设计', href: '#' },
    { label: '包装设计', href: '#' },
    { label: '网站设计', href: '#' },
    { label: '画册设计', href: '#' },
  ],
  company: [
    { label: '关于我们', href: '#about' },
    { label: '作品案例', href: '#works' },
    { label: '新闻动态', href: '#' },
    { label: '加入我们', href: '#' },
  ],
  social: [
    { label: '微信公众号', href: '#' },
    { label: '微博', href: '#' },
    { label: 'Behance', href: '#' },
    { label: 'Dribbble', href: '#' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-ink-950 border-t border-ink-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <span className="font-display text-xl text-ink-950">D</span>
              </div>
              <span className="font-display text-2xl tracking-tight">
                <span className="text-ink-100">Donhauser</span>
                <span className="text-gold-400">.</span>
              </span>
            </a>
            <p className="text-ink-500 leading-relaxed max-w-sm mb-6">
              专注品牌视觉设计十五年，为企业提供专业的设计解决方案，
              用设计讲述品牌故事，创造商业价值。
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-ink-800 flex items-center justify-center text-ink-500 hover:border-gold-500/50 hover:text-gold-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-ink-800 flex items-center justify-center text-ink-500 hover:border-gold-500/50 hover:text-gold-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-ink-100 font-medium mb-4">服务</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-ink-500 hover:text-gold-400 transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-ink-100 font-medium mb-4">公司</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-ink-500 hover:text-gold-400 transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-ink-100 font-medium mb-4">关注我们</h4>
            <ul className="space-y-3">
              {footerLinks.social.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-ink-500 hover:text-gold-400 transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-ink-900 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-ink-600 text-sm">
            © 2024 Donhauser Design. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="text-ink-600 hover:text-ink-400 transition-colors">
              隐私政策
            </a>
            <a href="#" className="text-ink-600 hover:text-ink-400 transition-colors">
              服务条款
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

