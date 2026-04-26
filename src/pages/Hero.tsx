import './Hero.css';
import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import BigAtlass from '../assets/BigAtlass.png';
import HeroSection from '../components/HeroSection';
import AboutUsSection from '../components/AboutUsSection';
import HowitsWorks from '../components/HowItsWorks';
import FeatureSection from '../components/FeatureSection';
import RIhlaBanner from '../components/shared/RihlaBanner';
import Footer from '../components/Footer';
import Header from '../components/Header';

gsap.registerPlugin(ScrollTrigger);

function Hero() {
  const mainRef = useRef(null);
  const aboutRef = useRef(null);
  const howItWorksRef = useRef(null);
  const featuresRef = useRef(null);
  const rihlaRef = useRef(null);
  const footerRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-content', {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      });

      gsap.from('.hero-image', {
        y: 80,
        opacity: 0,
        duration: 1.2,
        delay: 0.3,
        ease: 'power3.out',
      });

      gsap.from('.about-content', {
        scrollTrigger: {
          trigger: aboutRef.current,
          start: 'top 80%',
          end: 'top 20%',
          toggleActions: 'play none none reverse',
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });

      gsap.from('.how-it-works-item', {
        scrollTrigger: {
          trigger: howItWorksRef.current,
          start: 'top 75%',
          end: 'top 20%',
          toggleActions: 'play none none reverse',
        },
        y: 60,
        opacity: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power2.out',
      });

      gsap.from('.feature-right', {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
        x: 60,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power2.out',
      });

      gsap.from('.feature-left', {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
        x: 60,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power2.out',
      });

      gsap.from('.rihla-image', {
        scrollTrigger: {
          trigger: rihlaRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
        scale: 0.8,
        opacity: 0,
        duration: 0.8,
        ease: 'back.out(1.7)',
      });

      gsap.from('.Rihla-section .hero-button', {
        scrollTrigger: {
          trigger: rihlaRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        delay: 0.3,
        ease: 'power2.out',
      });

      gsap.from('.footer-brand', {
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
        y: 40,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
      });

      gsap.from('.footer-column', {
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
      });

      gsap.from('.footer-bottom', {
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 60%',
          toggleActions: 'play none none reverse',
        },
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
      });
    }, mainRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={mainRef}>
      <Header />
      <HeroSection />
      <AboutUsSection aboutRef={aboutRef} />
      <HowitsWorks howItWorksRef={howItWorksRef} />
      <FeatureSection featuresRef={featuresRef} />
      <RIhlaBanner rihlaRef={rihlaRef} />
      <Footer footerRef={footerRef} />
    </div>
  );
}

export default Hero;