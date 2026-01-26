import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const NotificationPopup = () => {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only fetch notifications if user is authenticated
        if (!authLoading && isAuthenticated) {
            fetchNotifications();
        } else if (!authLoading && !isAuthenticated) {
            setLoading(false);
        }
    }, [isAuthenticated, authLoading]);

    const fetchNotifications = async () => {
        try {
            const response = await axios.get(`${API_URL}/notifications`);
            const allNotifications = response.data;

            console.log('All notifications:', allNotifications);

            // If there are no notifications, exit early
            if (!allNotifications || allNotifications.length === 0) {
                console.log('No notifications found');
                setLoading(false);
                return;
            }

            // Get last seen notification timestamp from localStorage
            const lastSeen = localStorage.getItem('lastSeenNotification');
            console.log('Last seen:', lastSeen);

            // If no lastSeen, show the most recent notification (first visit)
            if (!lastSeen) {
                console.log('First visit - showing latest notification');
                setNotifications([allNotifications[0]]); // Show only the most recent
                setIsVisible(true);
            } else {
                const lastSeenTime = new Date(lastSeen).getTime();

                // Filter only new notifications (created after last seen)
                const newNotifications = allNotifications.filter(notif => {
                    const notifTime = new Date(notif.created_at).getTime();
                    return notifTime > lastSeenTime;
                });

                console.log('New notifications:', newNotifications);

                if (newNotifications.length > 0) {
                    setNotifications(newNotifications);
                    setIsVisible(true);
                }
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        // Save current time as last seen
        localStorage.setItem('lastSeenNotification', new Date().toISOString());
        setIsVisible(false);
    };

    const handleNext = () => {
        if (currentIndex < notifications.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading || notifications.length === 0) {
        return null;
    }

    const currentNotification = notifications[currentIndex];

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000]"
                    />

                    {/* Popup */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-[1001] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="w-full max-w-lg pointer-events-auto bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#d946ef] to-[#06b6d4] flex items-center justify-center">
                                        <Bell className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold">New Notification</h3>
                                        <p className="text-xs text-gray-400">
                                            {notifications.length > 1
                                                ? `${currentIndex + 1} of ${notifications.length}`
                                                : 'Important Update'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {currentNotification.image_url && (
                                    <div className="mb-4 rounded-xl overflow-hidden">
                                        <img
                                            src={currentNotification.image_url}
                                            alt={currentNotification.title}
                                            className="w-full h-48 object-cover"
                                        />
                                    </div>
                                )}

                                <h4 className="text-xl font-bold text-white mb-2">
                                    {currentNotification.title}
                                </h4>

                                <p className="text-gray-300 leading-relaxed mb-4">
                                    {currentNotification.message}
                                </p>

                                <p className="text-xs text-gray-500">
                                    {formatDate(currentNotification.created_at)}
                                </p>
                            </div>

                            {/* Footer - Only show if multiple notifications */}
                            {notifications.length > 1 && (
                                <div className="flex items-center justify-center px-6 py-4 border-t border-white/10 bg-white/5">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handlePrev}
                                            disabled={currentIndex === 0}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4 text-white" />
                                        </button>
                                        <span className="text-sm text-gray-400 px-2">
                                            {currentIndex + 1} / {notifications.length}
                                        </span>
                                        <button
                                            onClick={handleNext}
                                            disabled={currentIndex === notifications.length - 1}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NotificationPopup;
