import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

const navItems = [
  { label: '服务', href: '#services' },
  { label: '作品', href: '#works' },
  { label: '关于', href: '#about' },
  { label: '联系', href: '#contact' },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-ink-950/90 backdrop-blur-md border-b border-ink-800/50'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <span className="font-display text-xl text-ink-950">D</span>
            </div>
            <span className="font-display text-2xl tracking-tight">
              <span className="text-ink-100">Donhauser</span>
              <span className="text-gold-400">.</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-ink-300 hover:text-gold-400 transition-colors duration-300 text-sm tracking-wide"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#contact"
              className="px-5 py-2.5 bg-gold-500 text-ink-950 text-sm font-medium rounded-full hover:bg-gold-400 transition-colors duration-300"
            >
              开始合作
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-ink-300 hover:text-gold-400 transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-ink-900/95 backdrop-blur-md border-t border-ink-800/50">
          <nav className="flex flex-col px-6 py-6 gap-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-ink-200 hover:text-gold-400 transition-colors py-2 text-lg"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="mt-4 px-5 py-3 bg-gold-500 text-ink-950 text-center font-medium rounded-full"
            >
              开始合作
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}

