import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ArrowLeft, Trophy, Users } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const MyRegistrationsPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await axios.get(`${API_URL}/registrations/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegistrations(response.data);
    } catch (error) {
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const getSubFestColor = (subFest) => {
    if (subFest.includes('CULTURAL')) return '#d946ef';
    if (subFest.includes('SPORTS')) return '#f97316';
    if (subFest.includes('TECHNOLOGY')) return '#06b6d4';
    return '#ffffff';
  };

  return (
    <div className="min-h-screen bg-[#030712]" data-testid="my-registrations-page">
      {/* Header */}
      <div className="glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
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

      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <Trophy className="w-12 h-12 text-[#d946ef]" />
            <div>
              <h1 className="text-5xl font-black" data-testid="page-title">My Registrations</h1>
              <p className="text-gray-400 mt-2">All your registered events in one place</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400" data-testid="loading-state">Loading registrations...</div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-state">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">You haven't registered for any events yet</p>
              <button
                onClick={() => navigate('/events')}
                className="px-8 py-3 bg-[#d946ef] hover:bg-[#ec4899] text-white font-bold uppercase tracking-wider transition-colors"
                data-testid="browse-events-button"
              >
                Browse Events
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {registrations.map((reg, idx) => (
                <motion.div
                  key={reg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass p-6 rounded-none"
                  data-testid={`registration-card-${reg.id}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div
                        className="w-16 h-1 mb-3"
                        style={{ backgroundColor: getSubFestColor(reg.sub_fest) }}
                      />
                      <h3 className="text-2xl font-bold mb-2" data-testid={`event-name-${reg.id}`}>{reg.event_name}</h3>
                      <p className="text-gray-400 mb-3">{reg.sub_fest.split('-')[1]}</p>

                      {reg.team_members && reg.team_members.length > 0 && (
                        <div className="mt-4" data-testid={`team-members-${reg.id}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-gray-400" />
                            <p className="text-sm text-gray-400">Team Members:</p>
                          </div>
                          <div className="space-y-1 ml-7">
                            {reg.team_members.map((member, i) => (
                              <p key={i} className="text-sm text-gray-300" data-testid={`member-${i}`}>{member}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Registered on</p>
                      <p className="text-lg font-medium" data-testid={`registered-date-${reg.id}`}>
                        {new Date(reg.registered_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
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

export default MyRegistrationsPage;