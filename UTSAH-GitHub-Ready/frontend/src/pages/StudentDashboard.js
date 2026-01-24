import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { LogOut, Calendar, Trophy, Bell, User } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const StudentDashboard = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ registrations: 0, notifications: 0 });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [regsRes, eventsRes, notifsRes] = await Promise.all([
        axios.get(`${API_URL}/registrations/my`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/events`),
        axios.get(`${API_URL}/notifications`)
      ]);

      setStats({
        registrations: regsRes.data.length,
        notifications: notifsRes.data.length
      });
      setEvents(eventsRes.data.slice(0, 6));
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const subFestColors = {
    'CULTURAL-AKANKSHA': '#d946ef',
    'SPORTS-AHWAAN': '#f97316',
    'TECHNOLOGY-ANWESH': '#06b6d4'
  };

  return (
    <div className="min-h-screen bg-[#030712]" data-testid="student-dashboard">
      {/* Header */}
      <div className="glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#d946ef] to-[#ec4899]"
              data-testid="dashboard-title"
            >
              UTSAH
            </motion.h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm text-gray-400">Welcome back,</p>
              <p className="font-medium text-white" data-testid="user-name">{user?.full_name}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 glass hover:bg-white/10 transition-colors flex items-center gap-2"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate('/my-registrations')}
            className="glass p-6 rounded-none cursor-pointer hover:bg-white/5 transition-colors"
            data-testid="registrations-card"
          >
            <Trophy className="w-10 h-10 text-[#d946ef] mb-3" />
            <p className="text-3xl font-black mb-1" data-testid="registrations-count">{stats.registrations}</p>
            <p className="text-gray-400 text-sm">My Registrations</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate('/events')}
            className="glass p-6 rounded-none cursor-pointer hover:bg-white/5 transition-colors"
            data-testid="events-card"
          >
            <Calendar className="w-10 h-10 text-[#f97316] mb-3" />
            <p className="text-3xl font-black mb-1">{events.length}+</p>
            <p className="text-gray-400 text-sm">Available Events</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate('/notifications')}
            className="glass p-6 rounded-none cursor-pointer hover:bg-white/5 transition-colors"
            data-testid="notifications-card"
          >
            <Bell className="w-10 h-10 text-[#06b6d4] mb-3" />
            <p className="text-3xl font-black mb-1" data-testid="notifications-count">{stats.notifications}</p>
            <p className="text-gray-400 text-sm">Notifications</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass p-6 rounded-none"
            data-testid="profile-card"
          >
            <User className="w-10 h-10 text-gray-400 mb-3" />
            <p className="text-lg font-bold mb-1">{user?.roll_number}</p>
            <p className="text-gray-400 text-sm">{user?.department}</p>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-black mb-6" data-testid="quick-actions-title">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => navigate('/events')}
              className="glass p-6 rounded-none text-left hover:bg-white/5 transition-colors group"
              data-testid="browse-events-button"
            >
              <Calendar className="w-8 h-8 text-[#d946ef] mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2">Browse Events</h3>
              <p className="text-gray-400 text-sm">Explore all events across sub-fests</p>
            </button>

            <button
              onClick={() => navigate('/my-registrations')}
              className="glass p-6 rounded-none text-left hover:bg-white/5 transition-colors group"
              data-testid="my-registrations-button"
            >
              <Trophy className="w-8 h-8 text-[#f97316] mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2">My Registrations</h3>
              <p className="text-gray-400 text-sm">View your registered events</p>
            </button>

            <button
              onClick={() => navigate('/gallery')}
              className="glass p-6 rounded-none text-left hover:bg-white/5 transition-colors group"
              data-testid="view-gallery-button"
            >
              <Bell className="w-8 h-8 text-[#06b6d4] mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2">View Gallery</h3>
              <p className="text-gray-400 text-sm">Relive memorable moments</p>
            </button>
          </div>
        </motion.div>

        {/* Featured Events */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black" data-testid="featured-events-title">Featured Events</h2>
            <button
              onClick={() => navigate('/events')}
              className="text-[#d946ef] hover:text-[#ec4899] font-medium"
              data-testid="view-all-events-link"
            >
              View All →
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading events...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + idx * 0.1 }}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="glass p-6 rounded-none cursor-pointer hover:bg-white/5 transition-colors event-card"
                  data-testid={`event-card-${event.id}`}
                >
                  <div
                    className="w-12 h-1 mb-4"
                    style={{ backgroundColor: subFestColors[event.sub_fest] }}
                  />
                  <h3 className="text-xl font-bold mb-2">{event.name}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{event.event_type}</span>
                    <span className="text-[#d946ef]">{event.registered_count}/{event.capacity}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDashboard;