import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, Users, Trophy, ArrowRight, Play, Music, Cpu, Medal, Instagram, MessageCircle, Mail, Code, Crown, X } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showCredits, setShowCredits] = useState(false);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // Mouse move effect for hero
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ clientX, clientY, currentTarget }) {
    let { left, top, width, height } = currentTarget.getBoundingClientRect();
    let xPosition = clientX - left;
    let yPosition = clientY - top;
    mouseX.set(xPosition);
    mouseY.set(yPosition);
  }

  const teamMembers = [
    {
      name: "Dilshad Ali Khan",
      role: "Head Coordinator & Full-Stack Developer",
      designation: "Final Year B.Tech, CSE (AI)",
      image: "/dilshad.jpg"
    },
    {
      name: "Ashwini Kr. Khatua",
      role: "Head Coordinator & Full-Stack Developer ",
      designation: "Final Year B.Tech, CSE (AI)",
      image: "/ashwini.jpg"
    }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#030712] text-white selection:bg-[#d946ef] selection:text-white overflow-hidden" onMouseMove={handleMouseMove}>

      {/* Navbar Overlay */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#d946ef] to-[#06b6d4]">UTSAH</div>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setShowCredits(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            <Code className="w-4 h-4" />
            <span>Credits</span>
          </button>
          <div className="w-px h-6 bg-white/10 hidden md:block"></div>
          <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm font-bold uppercase tracking-wider hover:text-[#d946ef] transition-colors">Login</button>
          <button onClick={() => navigate('/register')} className="px-6 py-2 bg-[#d946ef] hover:bg-[#c026d3] text-white text-sm font-bold uppercase tracking-wider transition-colors clip-button">Register</button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* ... existing hero code ... */}
        {/* Animated Background Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:50px_50px] pointer-events-none" />

        {/* Spotlight Effect */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`
                    radial-gradient(
                    650px circle at ${mouseX}px ${mouseY}px,
                    rgba(217, 70, 239, 0.15),
                    transparent 80%
                    )
                `,
          }}
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-7xl mx-auto px-6 text-center"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
            className="mt-10 mb-1 relative z-10"
          >
            <img src="/logo.png" alt="UTSAH Logo" className="w-40 md:w-80 mx-auto drop-shadow-[0_0_50px_rgba(217,70,239,0.5)]" />
          </motion.div>

          {/* ... */}
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-2 -mt-6 leading-none">
            <motion.span
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-white text-5xl md:text-8xl"
            >
              2026
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-xl md:text-2xl text-gray-400 mb-8 -mt-13 max-w-2xl mx-auto font-light tracking-wide"
          >
            THE ULTIMATE CONVERGENCE OF <span className="text-white font-bold">CULTURE</span>, <span className="text-white font-bold">SPORTS</span> & <span className="text-white font-bold">TECH</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <button
              onClick={() => navigate('/register')}
              className="group relative px-8 py-4 bg-white text-black font-bold uppercase tracking-widest overflow-hidden hover:scale-105 transition-transform duration-300"
            >
              <span className="relative z-10 flex items-center gap-2">Register Now <ArrowRight className="w-4 h-4" /></span>
              <div className="absolute inset-0 bg-[#d946ef] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
            </button>
            <button
              onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 border border-white/20 text-white font-bold uppercase tracking-widest hover:bg-white/5 transition-colors"
            >
              Learn More
            </button>
          </motion.div>
        </motion.div>

        {/* Floating Icons Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FloatingElement icon={Music} color="#d946ef" x="10%" y="20%" delay={0} />
          <FloatingElement icon={Cpu} color="#06b6d4" x="85%" y="15%" delay={2} />
          <FloatingElement icon={Medal} color="#f97316" x="20%" y="80%" delay={4} />
          <FloatingElement icon={Trophy} color="#22c55e" x="80%" y="75%" delay={6} />
        </div>
      </div>

      {/* Credits Modal */}
      {showCredits && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-8 max-w-2xl w-full relative border border-white/10"
          >
            <button
              onClick={() => setShowCredits(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-3xl font-black mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-[#d946ef] to-[#06b6d4]">
              BEHIND THE SCENES
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {teamMembers.map((member, i) => (
                <div key={i} className="glass p-6 border-transparent hover:border-white/20 transition-colors flex flex-col items-center text-center">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-24 h-24 rounded-full mb-4 border-2 border-[#d946ef]"
                  />
                  <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                  <p className="text-sm text-[#06b6d4] font-medium uppercase tracking-wide">{member.role}</p>
                  <p className="text-xs text-gray-400 mt-1 tracking-wide">
                    {member.designation}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center text-gray-500 text-sm">
              © 2026 UTSAH Team. Crafted with  ❤
            </div>
          </motion.div>
        </div>
      )}

      {/* TICKER TAPE */}
      <div className="bg-[#d946ef] py-4 rotate-1 scale-110 overflow-hidden shadow-[0_0_50px_rgba(217,70,239,0.5)] z-20 relative my-12">
        <motion.div
          className="flex gap-5 whitespace-nowrap text-black font-black text-2xl uppercase tracking-widest"
          animate={{ x: [0, -1000] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        >
          {[...Array(20)].map((_, i) => (
            <span key={i} className="flex items-center gap-5">
              UTSAH 2026 ✦ GITA AUTONOMOUS COLLEGE ✦ REGISTER NOW ✦
            </span>
          ))}
        </motion.div>
      </div>

      {/* ABOUT SECTION */}
      <section id="about" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#d946ef] to-[#06b6d4] opacity-75 blur-2xl group-hover:opacity-100 transition-opacity duration-500" />
            <img
              src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop"
              alt="Concert Crowd"
              className="relative z-10 w-full h-[500px] object-cover grayscale group-hover:grayscale-0 transition-all duration-700 clip-path-polygon"
            />
          </div>

          <div>
            <motion.h2
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-7xl font-black mb-8 leading-tight"
            >
              IGNITE <br />
              <span className="text-[#06b6d4]">YOUR</span> <br />
              PASSION
            </motion.h2>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              Experience <span className="font-bold italic text-white">120 hours</span> of non-stop energy, creativity, and competition.
              UTSAH 2026 brings together the brightest minds and the most talented souls
              for an extravaganza unlike any other.
            </p>

          </div>
        </div>
      </section>

      {/* SUB FESTS */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f172a] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-center mb-20"
          >
            THE TRINITY OF <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f97316] to-[#d946ef]">TALENT</span>
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            <FestCard
              title="AKANKSHA"
              subtitle="Cultural"
              color="#d946ef"
              icon={Music}
              img="/akanksha_black_tshirt.png"
              fit="contain"
              onClick={() => navigate('/events', { state: { subFest: 'CULTURAL-AKANKSHA' } })}
            />
            <FestCard
              title="AHWAAN"
              subtitle="Sports"
              color="#f97316"
              icon={Medal}
              img="/ahwan_white_tshirt.png"
              onClick={() => navigate('/events', { state: { subFest: 'SPORTS-AHWAAN' } })}
            />
            <FestCard
              title="ANWESH"
              subtitle="Technical"
              color="#06b6d4"
              icon={Cpu}
              img="/anwesh_grey_tshirt.png"
              onClick={() => navigate('/events', { state: { subFest: 'TECHNOLOGY-ANWESH' } })}
            />
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[#d946ef]/10" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 mix-blend-overlay pointer-events-none"></div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="relative z-10 max-w-4xl mx-auto glass p-12 border border-white/10"
        >
          <h2 className="text-5xl md:text-7xl font-black mb-6">READY TO SHINE?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Registrations are filling up fast. Don't miss your chance to be part of history.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-12 py-5 bg-white text-black text-xl font-bold uppercase tracking-widest hover:scale-105 transition-transform"
          >
            Get Your Pass
          </button>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#d946ef] to-[#06b6d4]">UTSAH 2026</div>
            <p className="text-gray-500 mt-2">GITA Autonomous College</p>
          </div>
          <div className="flex gap-6">
            <SocialLink icon={Instagram} href="https://www.instagram.com/utsah_gita?igsh=MXcweHNldWhmYXNvZQ==" />
            <SocialLink icon={WhatsAppIcon} href="https://chat.whatsapp.com/JozxBjfWWw0BIgYod2PRWL" />
            <SocialLink icon={Mail} href="mailto:utsahgita.official@gmail.com" />
          </div>
          <div className="text-gray-600 text-sm">
            &copy; 2026 Utsah Team. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

// Helper Components

const FloatingElement = ({ icon: Icon, color, x, y, delay }) => (
  <motion.div
    className="absolute w-16 h-16 opacity-30"
    style={{ left: x, top: y, color: color }}
    animate={{
      y: [0, -20, 0],
      rotate: [0, 10, -10, 0],
      scale: [1, 1.1, 1]
    }}
    transition={{
      duration: 5,
      repeat: Infinity,
      delay: delay,
      ease: "easeInOut"
    }}
  >
    <Icon className="w-full h-full" />
  </motion.div>
);

const FestCard = ({ title, subtitle, desc, color, icon: Icon, img, onClick, fit = "cover" }) => (
  <motion.div
    onClick={onClick}
    className="group relative h-[400px] overflow-hidden cursor-pointer"
    whileHover={{ y: -10 }}
  >
    <div className="absolute inset-0 bg-black/50 z-10 group-hover:bg-black/30 transition-colors duration-500" />
    <img src={img} alt={title} className={`absolute inset-0 w-full h-full object-${fit} grayscale group-hover:grayscale-0 scale-100 group-hover:scale-110 transition-all duration-700`} />

    <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
      <div
        className="w-12 h-12 mb-4 rounded-full flex items-center justify-center text-black transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500"
        style={{ backgroundColor: color }}
      >
        <Icon className="w-6 h-6" />
      </div>

      <p className="text-sm font-bold tracking-widest uppercase mb-2" style={{ color: color }}>
        {subtitle}
      </p>
      <h3 className="text-4xl font-black text-white mb-2">{title}</h3>
      <p className="text-gray-300 opacity-80 max-w-[250px] transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
        {desc}
      </p>
    </div>

    {/* Border Effect */}
    <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/20 transition-colors duration-500 z-30" />
  </motion.div>
);

const WhatsAppIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
  </svg>
);

const SocialLink = ({ icon: Icon, href }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white hover:text-black transition-all">
    <Icon className="w-5 h-5" />
  </a>
);

export default LandingPage;