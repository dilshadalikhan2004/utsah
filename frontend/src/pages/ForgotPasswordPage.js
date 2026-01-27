import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Send, CheckCircle } from 'lucide-react';
import apiClient from '../utils/apiClient';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error('Please enter a valid email address');
            setLoading(false);
            return;
        }

        try {
            await apiClient.post('/auth/forgot-password', { email });
            setEmailSent(true);
            toast.success('Password reset link sent! Check your email.');
        } catch (error) {
            // Still show success to prevent email enumeration
            setEmailSent(true);
            toast.success('If an account exists, you will receive a reset link.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] flex items-center justify-center px-6" data-testid="forgot-password-page">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                    data-testid="back-button"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Login
                </button>

                <div className="glass p-8 rounded-none">
                    {!emailSent ? (
                        <>
                            <div className="mb-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#d946ef] to-[#ec4899] rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Mail className="w-8 h-8 text-white" />
                                </div>
                                <h1 className="text-3xl font-black text-center bg-clip-text text-transparent bg-gradient-to-r from-[#d946ef] to-[#ec4899]" data-testid="forgot-password-title">
                                    Forgot Password?
                                </h1>
                                <p className="text-gray-400 text-center mt-2">
                                    No worries! Enter your email and we'll send you a reset link.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-transparent border-b border-white/20 focus:border-white/80 pl-12 pr-4 py-3 text-white outline-none transition-colors"
                                            placeholder="your.email@example.com"
                                            required
                                            data-testid="email-input"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-[#d946ef] hover:bg-[#ec4899] text-white font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    data-testid="submit-button"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Send Reset Link
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8"
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
                            <p className="text-gray-400 mb-6">
                                We've sent a password reset link to <span className="text-[#d946ef]">{email}</span>
                            </p>
                            <p className="text-gray-500 text-sm mb-8">
                                Didn't receive the email? Check your spam folder or{' '}
                                <button
                                    onClick={() => setEmailSent(false)}
                                    className="text-[#d946ef] hover:text-[#ec4899] underline"
                                >
                                    try again
                                </button>
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-3 border border-white/20 hover:border-white/40 text-white font-medium transition-colors"
                            >
                                Return to Login
                            </button>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
