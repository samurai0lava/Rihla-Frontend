import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Header.css';
import LoginBtn from './shared/LoginBtn.js';
import DesktopNav from './DesktopNav.jsx';
import LogoRihla from './LogoRihla.jsx';
import ThemeToggle from './shared/ThemeToggle';

function Header() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const heroHeight = window.innerHeight;
    setIsScrolled(window.scrollY >= heroHeight - 64);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight;
      setIsScrolled(window.scrollY >= heroHeight - 64);
      if (mobileMenuOpen) setMobileMenuOpen(false);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const sections = ['about', 'how-it-works', 'features'];
    
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px', 
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  const navLinks = [
    { href: '/#about', label: 'About Us', id: 'about' },
    { href: '/#how-it-works', label: 'How it Works', id: 'how-it-works' },
    { href: '/#features', label: 'Features', id: 'features' },
  ];

  const headerModifierClass = isScrolled
    ? 'scrolled'
    : isLanding
      ? ''
      : 'bar-document';

  return (
    <header className={`Header ${headerModifierClass}`.trim()}>
      <nav className="nav">
        <div className="nav-container">
          <LogoRihla/>
          <DesktopNav activeSection={activeSection} />
          <div className="nav-right">
            <ThemeToggle />
            <LoginBtn />
            <button
              className={`nav-hamburger ${mobileMenuOpen ? 'open' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        {navLinks.map((link) => (
          <a
            key={link.id}
            href={link.href}
            className={`mobile-nav-link ${activeSection === link.id ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            {link.label}
          </a>
        ))}
        <div className="mobile-menu-actions">
          <LoginBtn />
        </div>
      </div>
    </header>
  );
}

export default Header;