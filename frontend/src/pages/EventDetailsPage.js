import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ArrowLeft, Calendar, MapPin, Users, Clock, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const EventDetailsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [teamMembers, setTeamMembers] = useState([{
    full_name: '',
    email: '',
    roll_number: '',
    department: '',
    year: 1,
    mobile_number: ''
  }]);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await axios.get(`${API_URL}/events/${eventId}`);
      setEvent(response.data);

      if (response.data.event_type === 'team') {
        const initialMembers = Array(response.data.min_team_size).fill(null).map(() => ({
          full_name: '',
          email: '',
          roll_number: '',
          department: '',
          year: 1,
          mobile_number: ''
        }));
        setTeamMembers(initialMembers);
      }
    } catch (error) {
      toast.error('Failed to load event details');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (event.event_type === 'team') {
      const validMembers = teamMembers.filter(member =>
        member.full_name.trim() !== '' &&
        member.email.trim() !== '' &&
        member.roll_number.trim() !== '' &&
        member.department.trim() !== '' &&
        member.mobile_number.trim() !== ''
      );

      if (validMembers.length < event.min_team_size) {
        toast.error(`Minimum ${event.min_team_size} team members required with complete details`);
        return;
      }
      if (validMembers.length > event.max_team_size) {
        toast.error(`Maximum ${event.max_team_size} team members allowed`);
        return;
      }
    }

    setRegistering(true);
    try {
      const payload = {
        event_id: eventId,
        team_members: event.event_type === 'team' ? teamMembers.filter(m => m.email.trim()) : null
      };

      await axios.post(`${API_URL}/registrations`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Registration successful!');
      navigate('/my-registrations');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const addTeamMember = () => {
    if (teamMembers.length < event.max_team_size) {
      setTeamMembers([...teamMembers, {
        full_name: '',
        email: '',
        roll_number: '',
        department: '',
        year: 1,
        mobile_number: ''
      }]);
    }
  };

  const removeTeamMember = (index) => {
    if (teamMembers.length > event.min_team_size) {
      setTeamMembers(teamMembers.filter((_, i) => i !== index));
    }
  };

  const updateTeamMember = (index, field, value) => {
    const newMembers = [...teamMembers];
    newMembers[index][field] = value;
    setTeamMembers(newMembers);
  };

  const getSubFestColor = () => {
    if (event?.sub_fest.includes('CULTURAL')) return '#d946ef';
    if (event?.sub_fest.includes('SPORTS')) return '#f97316';
    if (event?.sub_fest.includes('TECHNOLOGY')) return '#06b6d4';
    return '#ffffff';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="text-gray-400">Loading event details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712]" data-testid="event-details-page">
      {/* Header */}
      <div className="glass border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/events')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Events
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            className="w-24 h-2 mb-6"
            style={{ backgroundColor: getSubFestColor() }}
          />

          <h1 className="text-5xl font-black mb-4" data-testid="event-title">{event.name}</h1>
          <p className="text-xl text-gray-400 mb-2" data-testid="event-subfest">
            {event.sub_fest.split('-')[1]}
          </p>
          <p className="text-gray-300 mb-8" data-testid="event-description">{event.description}</p>

          {/* Event Details */}
          <div className="glass p-6 rounded-none">
            <Users className="w-6 h-6 mb-3" style={{ color: getSubFestColor() }} />
            <p className="text-sm text-gray-500 mb-1">Event Type</p>
            <p className="text-lg font-medium capitalize" data-testid="event-type">{event.event_type}</p>
          </div>

          {/* Coordinators */}
          <div className="glass p-6 rounded-none mb-8">
            <h3 className="text-xl font-bold mb-4">Coordinators</h3>
            <div className="space-y-2">
              {event.coordinators.map((coord, idx) => (
                <p key={idx} className="text-gray-300" data-testid={`coordinator-${idx}`}>{coord}</p>
              ))}
            </div>
          </div>

          {/* Team Registration Form */}
          {event.event_type === 'team' && (
            <div className="glass p-6 rounded-none mb-8" data-testid="team-registration-form">
              <h3 className="text-xl font-bold mb-4">Team Members</h3>
              <p className="text-sm text-gray-400 mb-6">
                Team size: {event.min_team_size} - {event.max_team_size} members
              </p>

              <div className="space-y-8">
                {teamMembers.map((member, idx) => (
                  <div key={idx} className="border border-white/10 p-4 rounded-none">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-lg">Team Member {idx + 1}</h4>
                      {teamMembers.length > event.min_team_size && (
                        <button
                          onClick={() => removeTeamMember(idx)}
                          className="px-4 py-2 glass hover:bg-red-500/20 transition-colors text-sm"
                          data-testid={`remove-member-${idx}`}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Full Name *</label>
                        <input
                          type="text"
                          value={member.full_name}
                          onChange={(e) => updateTeamMember(idx, 'full_name', e.target.value)}
                          placeholder="John Doe"
                          className="w-full bg-transparent border-b border-white/20 focus:border-white/80 px-4 py-3 text-white"
                          data-testid={`team-member-name-${idx}`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Email *</label>
                        <input
                          type="email"
                          value={member.email}
                          onChange={(e) => updateTeamMember(idx, 'email', e.target.value)}
                          placeholder="john@example.com"
                          className="w-full bg-transparent border-b border-white/20 focus:border-white/80 px-4 py-3 text-white"
                          data-testid={`team-member-email-${idx}`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Roll Number *</label>
                        <input
                          type="text"
                          value={member.roll_number}
                          onChange={(e) => updateTeamMember(idx, 'roll_number', e.target.value)}
                          placeholder="2026CS001"
                          className="w-full bg-transparent border-b border-white/20 focus:border-white/80 px-4 py-3 text-white"
                          data-testid={`team-member-roll-${idx}`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Department *</label>
                        <input
                          type="text"
                          value={member.department}
                          onChange={(e) => updateTeamMember(idx, 'department', e.target.value)}
                          placeholder="Computer Science"
                          className="w-full bg-transparent border-b border-white/20 focus:border-white/80 px-4 py-3 text-white"
                          data-testid={`team-member-dept-${idx}`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Year *</label>
                        <select
                          value={member.year}
                          onChange={(e) => updateTeamMember(idx, 'year', parseInt(e.target.value))}
                          className="w-full bg-[#0f172a] border-b border-white/20 focus:border-white/80 px-4 py-3 text-white"
                          data-testid={`team-member-year-${idx}`}
                        >
                          <option value={1}>1st Year</option>
                          <option value={2}>2nd Year</option>
                          <option value={3}>3rd Year</option>
                          <option value={4}>4th Year</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Mobile Number *</label>
                        <input
                          type="tel"
                          value={member.mobile_number}
                          onChange={(e) => updateTeamMember(idx, 'mobile_number', e.target.value)}
                          placeholder="9876543210"
                          className="w-full bg-transparent border-b border-white/20 focus:border-white/80 px-4 py-3 text-white"
                          data-testid={`team-member-mobile-${idx}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {teamMembers.length < event.max_team_size && (
                <button
                  onClick={addTeamMember}
                  className="mt-6 px-6 py-3 glass hover:bg-white/10 transition-colors"
                  data-testid="add-team-member-button"
                >
                  + Add Team Member
                </button>
              )}
            </div>
          )}

          {/* Registration Button */}
          {/* Registration Button */}
          {!event.is_registration_open ? (
            <button
              onClick={() => toast.error("The registration for this event is closed, contact the event coordinator")}
              className="w-full py-4 font-bold uppercase tracking-wider transition-colors bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              Registration Closed
            </button>
          ) : (
            <button
              onClick={handleRegister}
              disabled={registering || event.registered_count >= event.capacity}
              className="w-full py-4 font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: event.registered_count >= event.capacity ? '#666' : getSubFestColor()
              }}
              data-testid="register-button"
            >
              {registering ? 'Registering...' : event.registered_count >= event.capacity ? 'Event Full' : 'Register Now'}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EventDetailsPage;