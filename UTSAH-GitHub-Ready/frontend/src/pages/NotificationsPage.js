import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Bell } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications`);
      setNotifications(response.data);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712]" data-testid="notifications-page">
      {/* Header */}
      <div className="glass border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/student')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <Bell className="w-12 h-12 text-[#d946ef]" />
            <div>
              <h1 className="text-5xl font-black" data-testid="notifications-title">Notifications</h1>
              <p className="text-gray-400 mt-2">Stay updated with fest announcements</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400" data-testid="loading-state">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-400" data-testid="empty-state">No notifications yet</div>
          ) : (
            <div className="space-y-6">
              {notifications.map((notif, idx) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass p-6 rounded-none"
                  data-testid={`notification-card-${notif.id}`}
                >
                  {notif.image_url && (
                    <img
                      src={notif.image_url}
                      alt={notif.title}
                      className="w-full h-48 object-cover mb-4"
                    />
                  )}
                  <h3 className="text-2xl font-bold mb-2" data-testid={`notification-title-${notif.id}`}>{notif.title}</h3>
                  <p className="text-gray-300 mb-3" data-testid={`notification-message-${notif.id}`}>{notif.message}</p>
                  <p className="text-sm text-gray-500" data-testid={`notification-date-${notif.id}`}>
                    {new Date(notif.created_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default NotificationsPage;