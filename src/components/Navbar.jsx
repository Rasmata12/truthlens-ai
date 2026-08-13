import React, { useState } from 'react';
import { Shield, Search, GraduationCap, Users, Gamepad2, LayoutDashboard, Sun, Moon, Menu, X } from 'lucide-react';
import { translations } from '../translations';

export default function Navbar({ activeTab, setActiveTab, language, setLanguage, theme, setTheme }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[language];

  const navItems = [
    { id: 'verifier', label: t.nav.verifier, icon: Search },
    { id: 'training', label: t.nav.training, icon: GraduationCap },
    { id: 'community', label: t.nav.community, icon: Users },
    { id: 'kids', label: t.nav.kids, icon: Gamepad2 },
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard }
  ];

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Logo */}
        <a href="#" className="navbar-logo" onClick={() => handleNavClick('verifier')}>
          <Shield size={28} className="animate-float" style={{ color: 'var(--primary)' }} />
          <span>TruthLens AI</span>
        </a>

        {/* Controls (Theme and Lang) - Positioned next to menu on desktop, absolute on mobile */}
        <div className="nav-controls">
          <button 
            className="lang-selector-btn" 
            onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
            title="Change language"
          >
            {language === 'fr' ? 'EN' : 'FR'}
          </button>
          
          <button 
            className="nav-control-btn" 
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Hamburger Toggle (Mobile Only) */}
        <button 
          className="menu-toggle-btn" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Navigation Menu Links */}
        <nav className={`navbar-menu ${mobileMenuOpen ? 'open' : ''}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`navbar-item ${activeTab === item.id ? 'active' : ''}`}
                style={
                  item.id === 'kids' && activeTab === 'kids'
                    ? { borderBottomColor: '#ffee55', color: '#ffee55' }
                    : {}
                }
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
