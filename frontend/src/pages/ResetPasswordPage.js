import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, XCircle, KeyRound } from 'lucide-react';
import apiClient from '../utils/apiClient';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [error, setError] = useState('');

    // Validate token exists
    useEffect(() => {
        if (!token) {
            setError('Invalid reset link. Please request a new password reset.');
        }
    }, [token]);

    const passwordRequirements = [
        { label: 'At least 6 characters', met: formData.password.length >= 6 },
        { label: 'Passwords match', met: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 }
    ];

    const isFormValid = passwordRequirements.every(req => req.met);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isFormValid) {
            toast.error('Please meet all password requirements');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await apiClient.post('/auth/reset-password', {
                token,
                new_password: formData.password
            });
            setResetSuccess(true);
            toast.success('Password reset successful!');
        } catch (err) {
            const message = err.response?.data?.detail || 'Failed to reset password. Please try again.';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    if (error && !token) {
        return (
            <div className="min-h-screen bg-[#030712] flex items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md glass p-8 rounded-none text-center"
                >
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Invalid Reset Link</h2>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/forgot-password')}
                        className="w-full py-3 bg-[#d946ef] hover:bg-[#ec4899] text-white font-bold transition-colors"
                    >
                        Request New Reset Link
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030712] flex items-center justify-center px-6" data-testid="reset-password-page">
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
                    {!resetSuccess ? (
                        <>
                            <div className="mb-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#d946ef] to-[#ec4899] rounded-full flex items-center justify-center mx-auto mb-6">
                                    <KeyRound className="w-8 h-8 text-white" />
                                </div>
                                <h1 className="text-3xl font-black text-center bg-clip-text text-transparent bg-gradient-to-r from-[#d946ef] to-[#ec4899]" data-testid="reset-password-title">
                                    Reset Password
                                </h1>
                                <p className="text-gray-400 text-center mt-2">
                                    Create a new secure password for your account.
                                </p>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-300">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-transparent border-b border-white/20 focus:border-white/80 pl-12 pr-12 py-3 text-white outline-none transition-colors"
                                            placeholder="••••••••"
                                            required
                                            data-testid="password-input"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-300">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full bg-transparent border-b border-white/20 focus:border-white/80 pl-12 pr-12 py-3 text-white outline-none transition-colors"
                                            placeholder="••••••••"
                                            required
                                            data-testid="confirm-password-input"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Password Requirements */}
                                <div className="space-y-2">
                                    {passwordRequirements.map((req, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm">
                                            {req.met ? (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <div className="w-4 h-4 border border-gray-500 rounded-full" />
                                            )}
                                            <span className={req.met ? 'text-green-500' : 'text-gray-500'}>
                                                {req.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !isFormValid}
                                    className="w-full py-4 bg-[#d946ef] hover:bg-[#ec4899] text-white font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    data-testid="submit-button"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Resetting...
                                        </>
                                    ) : (
                                        'Reset Password'
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
                            <h2 className="text-2xl font-bold text-white mb-4">Password Reset Successful!</h2>
                            <p className="text-gray-400 mb-8">
                                Your password has been updated. You can now login with your new password.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-4 bg-[#d946ef] hover:bg-[#ec4899] text-white font-bold uppercase tracking-wider transition-colors"
                            >
                                Go to Login
                            </button>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPasswordPage;
