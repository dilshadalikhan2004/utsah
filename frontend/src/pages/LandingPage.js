import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, Users, Trophy } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const subFests = [
    {
      name: 'CULTURAL',
      title: 'AKANKSHA',
      description: 'Unleash your artistic soul',
      color: '#d946ef',
      glowClass: 'glow-cultural',
      image: 'https://images.pexels.com/photos/102127/pexels-photo-102127.jpeg'
    },
    {
      name: 'SPORTS',
      title: 'AHWAAN',
      description: 'Rise to the challenge',
      color: '#f97316',
      glowClass: 'glow-sports',
      image: 'https://images.pexels.com/photos/5961761/pexels-photo-5961761.jpeg'
    },
    {
      name: 'TECHNOLOGY',
      title: 'ANWESH',
      description: 'Innovate the future',
      color: '#06b6d4',
      glowClass: 'glow-tech',
      image: 'https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxyb2JvdGljcyUyMHRlY2hub2xvZ3klMjBmdXR1cmlzdGljfGVufDB8fHx8MTc2OTI3Mzk5NXww&ixlib=rb-4.1.0&q=85'
    }
  ];

  return (
    <div className="min-h-screen bg-[#030712]">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 bg-gradient-to-b from-[#d946ef]/10 via-transparent to-transparent" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-6 max-w-6xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-6"
          >
            <Sparkles className="w-16 h-16 mx-auto text-[#d946ef] pulse-glow" />
          </motion.div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight mb-6" data-testid="hero-title">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#d946ef] via-[#f97316] to-[#06b6d4]">
              UTSAH
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-4 font-light" data-testid="hero-subtitle">
            GITA Autonomous College Annual Fest 2026
          </p>

          <p className="text-lg md:text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
            Three days of culture, sports, and technology. One unforgettable experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(217, 70, 239, 0.6)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
              className="px-10 py-4 bg-[#d946ef] text-white font-bold uppercase tracking-wider rounded-none text-lg"
              data-testid="register-button"
            >
              Register Now
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="px-10 py-4 glass text-white font-bold uppercase tracking-wider rounded-none text-lg"
              data-testid="login-button"
            >
              Login
            </motion.button>
          </div>
        </motion.div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.1
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>
      </section>

      {/* Sub-Fests Section */}
      <section className="py-24 px-6" data-testid="subfests-section">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto"
        >
          <h2 className="text-4xl md:text-6xl font-black text-center mb-6" data-testid="subfests-title">
            Three Festivals. One Vision.
          </h2>
          <p className="text-center text-gray-400 text-lg mb-16 max-w-2xl mx-auto">
            Experience the perfect blend of creativity, athleticism, and innovation
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {subFests.map((fest, idx) => (
              <motion.div
                key={fest.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass rounded-none overflow-hidden group cursor-pointer"
                data-testid={`subfest-card-${fest.name.toLowerCase()}`}
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={fest.image}
                    alt={fest.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent" />
                </div>

                <div className="p-6">
                  <p className="text-sm text-gray-500 mb-2 uppercase tracking-wider">{fest.name}</p>
                  <h3 className="text-3xl font-black mb-3" style={{ color: fest.color }}>
                    {fest.title}
                  </h3>
                  <p className="text-gray-400 mb-6">{fest.description}</p>
                  <button
                    onClick={() => navigate('/events', { state: { subFest: fest.name } })}
                    className="w-full py-3 glass font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
                    data-testid={`explore-${fest.name.toLowerCase()}-button`}
                  >
                    Explore Events
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Quick Links Section */}
      <section className="py-24 px-6 bg-[#0f172a]" data-testid="quick-links-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/gallery')}
              className="glass p-8 rounded-none cursor-pointer group"
              data-testid="gallery-link"
            >
              <Calendar className="w-12 h-12 text-[#d946ef] mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-2">Gallery</h3>
              <p className="text-gray-400">Relive the magical moments</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/shortlist')}
              className="glass p-8 rounded-none cursor-pointer group"
              data-testid="shortlist-link"
            >
              <Users className="w-12 h-12 text-[#f97316] mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-2">Aakanksha Shortlist</h3>
              <p className="text-gray-400">Check if you made the cut</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/events')}
              className="glass p-8 rounded-none cursor-pointer group"
              data-testid="events-link"
            >
              <Trophy className="w-12 h-12 text-[#06b6d4] mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-2">All Events</h3>
              <p className="text-gray-400">Browse and register</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10" data-testid="footer">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500">
            © 2026 UTSAH - GITA Autonomous College, Bhubaneswar. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;