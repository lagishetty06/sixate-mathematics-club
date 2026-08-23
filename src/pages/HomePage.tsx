import React from 'react';
import { Navbar } from '../components/public/Navbar';
import { Hero } from '../components/public/Hero';
import { About } from '../components/public/About';
import { Activities } from '../components/public/Activities';
import { WhyJoin } from '../components/public/WhyJoin';
import { Footer } from '../components/public/Footer';
import { MathBackground } from '../components/common/MathBackground';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-sixate-dark text-slate-100 relative selection:bg-sixate-purple selection:text-white">
      <MathBackground />
      <Navbar />
      <main>
        <Hero />
        <About />
        <Activities />
        <WhyJoin />
      </main>
      <Footer />
    </div>
  );
};
