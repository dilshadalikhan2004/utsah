import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/apiClient';
import { LogOut, Calendar, Trophy, Bell, User, Pencil, Users } from 'lucide-react';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const { user, logout, token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ registrations: 0, notifications: 0 });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  const filteredEvents = events.filter(event => {
    if (activeTab === 'ALL') return true;
    return event.sub_fest === activeTab;
  });

  const tabs = [
    { id: 'ALL', label: 'All Events' },
    { id: 'CULTURAL-AKANKSHA', label: 'Akanksha (Cultural)' },
    { id: 'SPORTS-AHWAAN', label: 'Ahwaan (Sports)' },
    { id: 'TECHNOLOGY-ANWESH', label: 'Anwesh (Tech)' }
  ];
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    department: '',
    year: 1,
    mobile_number: '',
    roll_number: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
        return;
      }
      setProfileForm({
        full_name: user.full_name || '',
        department: user.department || '',
        year: user.year || 1,
        mobile_number: user.mobile_number || '',
        roll_number: user.roll_number || ''
      });
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [regsRes, eventsRes, notifsRes] = await Promise.all([
        apiClient.get('/registrations/my'),
        apiClient.get('/events'),
        apiClient.get('/notifications')
      ]);

      setStats({
        registrations: regsRes.data.length,
        notifications: notifsRes.data.length
      });
      setEvents(eventsRes.data);
    } catch (error) {
      toast.error(error.userMessage || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    // Validation
    if (!profileForm.full_name.trim()) {
      toast.error('Full Name is required');
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(profileForm.mobile_number)) {
      toast.error('Mobile number must be exactly 10 digits');
      return;
    }

    try {
      await apiClient.put('/auth/me', profileForm);
      toast.success('Profile updated successfully');
      setShowProfileModal(false);
      await refreshUser();
    } catch (error) {
      toast.error(error.userMessage || 'Failed to update profile');
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
              className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#d946ef] to-[#ec4899] cursor-pointer hover:opacity-80 transition-opacity"
              data-testid="dashboard-title"
              onClick={() => navigate('/')}
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
            className="glass p-6 rounded-none relative group"
            data-testid="profile-card"
          >
            <button
              onClick={() => setShowProfileModal(true)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
              title="Edit Profile"
            >
              <Pencil className="w-5 h-5" />
            </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            <button
              onClick={() => navigate('/schedule')}
              className="glass p-6 rounded-none text-left hover:bg-white/5 transition-colors group"
              data-testid="view-schedule-button"
            >
              <Calendar className="w-8 h-8 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2">View Schedule</h3>
              <p className="text-gray-400 text-sm">Check timings & venues</p>
            </button>

            <button
              onClick={() => navigate('/coordinators')}
              className="glass p-6 rounded-none text-left hover:bg-white/5 transition-colors group"
              data-testid="view-coordinators-button"
            >
              <Users className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-2">Coordinators</h3>
              <p className="text-gray-400 text-sm">Contact event leads</p>
            </button>
          </div>
        </motion.div>

        {/* Events Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-black mb-6" data-testid="events-section-title">Explore Events</h2>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-none font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${activeTab === tab.id
                  ? 'bg-white text-black border-white'
                  : 'glass text-gray-400 border-transparent hover:border-white/20 hover:text-white'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Akanksha Special Section */}
          {activeTab === 'CULTURAL-AKANKSHA' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <button
                onClick={() => navigate('/schedule')}
                className="w-full glass p-8 border-l-4 border-[#d946ef] text-left hover:bg-white/5 transition-colors group relative overflow-hidden"
              >
                <div className="relative z-10">
                  <h3 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#d946ef] to-[#ec4899] mb-2 group-hover:translate-x-2 transition-transform">
                    Audition Registration & Rules →
                  </h3>
                  <p className="text-gray-300 max-w-xl">
                    Click here to view the complete schedule, venue details, and rules for the auditions.
                  </p>
                </div>
              </button>
            </motion.div>
          )}

          {/* Event Grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 glass rounded-none">
              <p className="text-gray-400">No events found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="glass p-6 rounded-none cursor-pointer hover:bg-white/5 transition-colors event-card relative"
                >
                  <div
                    className="w-12 h-1 mb-4"
                    style={{ backgroundColor: subFestColors[event.sub_fest] || '#FFF' }}
                  />
                  <h3 className="text-xl font-bold mb-2">{event.name}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>

                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="glass p-8 rounded-none max-w-md w-full">
            <h2 className="text-2xl font-black mb-6">Edit Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="w-full bg-transparent border-b border-white/20 focus:border-white/80 px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">Roll Number</label>
                <input
                  type="text"
                  value={profileForm.roll_number}
                  onChange={(e) => setProfileForm({ ...profileForm, roll_number: e.target.value })}
                  className="w-full bg-transparent border-b border-white/20 focus:border-white/80 px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">Department</label>
                <input
                  type="text"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  className="w-full bg-transparent border-b border-white/20 focus:border-white/80 px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">Year</label>
                <select
                  value={profileForm.year}
                  onChange={(e) => setProfileForm({ ...profileForm, year: parseInt(e.target.value) })}
                  className="w-full bg-[#0f172a] border-b border-white/20 px-4 py-2 text-white"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">Mobile Number</label>
                <input
                  type="tel"
                  value={profileForm.mobile_number}
                  onChange={(e) => setProfileForm({ ...profileForm, mobile_number: e.target.value })}
                  className="w-full bg-transparent border-b border-white/20 focus:border-white/80 px-4 py-2 text-white"
                />
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 glass hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#d946ef] hover:bg-[#ec4899] font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;