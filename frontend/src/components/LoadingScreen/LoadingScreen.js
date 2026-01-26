import { motion, AnimatePresence, useMotionValue, useSpring, useInView } from 'framer-motion';
import { useEffect, useState, useRef, useCallback } from 'react';

const LoadingScreen = ({ onLoadComplete, minDuration = 3000 }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [progress, setProgress] = useState(0);
    const containerRef = useRef(null);

    useEffect(() => {
        // Smooth progress increment
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / minDuration) * 100, 100);
            setProgress(Math.floor(newProgress));

            if (newProgress >= 100) {
                clearInterval(interval);
            }
        }, 30);

        // Minimum display time for the loading screen
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onLoadComplete) onLoadComplete();
        }, minDuration);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [minDuration, onLoadComplete]);

    // Hide scrollbar while loading
    useEffect(() => {
        if (isVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isVisible]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    ref={containerRef}
                    initial={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{
                        opacity: 0,
                        scale: 1.5,
                        filter: 'blur(10px)',
                    }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    className="fixed inset-0 z-[9999] bg-[#030712] flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Corner Decorations */}
                    <div className="absolute top-6 left-6 w-3 h-3 rounded-full border border-white/30" />
                    <div className="absolute top-6 right-6 w-3 h-3 rounded-full border border-white/30" />
                    <div className="absolute bottom-6 left-6 w-3 h-3 rounded-full border border-white/30" />
                    <div className="absolute bottom-6 right-6 w-3 h-3 rounded-full border border-white/30" />

                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:50px_50px] pointer-events-none" />

                    {/* Gradient Orb */}
                    <motion.div
                        className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-20"
                        style={{
                            background: 'radial-gradient(circle, #d946ef 0%, #06b6d4 50%, transparent 70%)',
                        }}
                        animate={{
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />

                    {/* Center Content - Logo & Loading Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="relative z-10 flex flex-col items-center"
                    >
                        {/* GITA Logo */}
                        <motion.img
                            src="/logo.png"
                            alt="UTSAH Logo"
                            className="w-40 md:w-56 mb-8 drop-shadow-[0_0_40px_rgba(217,70,239,0.4)]"
                            animate={{
                                filter: [
                                    'drop-shadow(0 0 20px rgba(217,70,239,0.3))',
                                    'drop-shadow(0 0 50px rgba(217,70,239,0.6))',
                                    'drop-shadow(0 0 20px rgba(217,70,239,0.3))',
                                ],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />

                        {/* Loading Bar - Connected to counter */}
                        <div className="w-64 md:w-80 h-[2px] bg-white/10 rounded-full overflow-hidden relative">
                            <motion.div
                                className="h-full bg-gradient-to-r from-[#d946ef] via-[#a855f7] to-[#06b6d4] rounded-full"
                                style={{ width: `${progress}%` }}
                                transition={{ duration: 0.1 }}
                            />
                            {/* Glow effect on progress bar */}
                            <motion.div
                                className="absolute top-0 h-full w-8 bg-white/50 blur-sm"
                                style={{ left: `${Math.max(0, progress - 5)}%` }}
                            />
                        </div>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            transition={{ delay: 0.3 }}
                            className="mt-4 text-sm text-gray-400 tracking-[0.3em] uppercase"
                        >
                            Loading Experience
                        </motion.p>
                    </motion.div>

                    {/* Bottom Left - Large Counter */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="absolute bottom-8 left-8 md:bottom-12 md:left-12"
                    >
                        <div className="flex items-baseline">
                            <span className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 tabular-nums">
                                {progress}
                            </span>
                            <span className="text-3xl md:text-5xl font-bold text-white/30 ml-1">%</span>
                        </div>
                    </motion.div>

                    {/* Bottom Right - UTSAH 2026 Text */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="absolute bottom-8 right-8 md:bottom-12 md:right-12 text-right"
                    >
                        <p className="text-xs text-gray-500 tracking-[0.2em] uppercase mb-1">
                            Presents
                        </p>
                        <h2 className="text-xl md:text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#d946ef] to-[#06b6d4]">
                            UTSAH 2026
                        </h2>
                        <p className="text-xs text-gray-600 tracking-wider mt-1">
                            GITA Autonomous College
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LoadingScreen;
