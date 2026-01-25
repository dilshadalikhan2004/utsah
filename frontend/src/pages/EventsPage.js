import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const EventsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubFest, setSelectedSubFest] = useState(location.state?.subFest || 'ALL');

  const subFests = [
    { name: 'ALL', color: '#ffffff' },
    { name: 'CULTURAL-AKANKSHA', color: '#d946ef' },
    { name: 'SPORTS-AHWAAN', color: '#f97316' },
    { name: 'TECHNOLOGY-ANWESH', color: '#06b6d4' }
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, selectedSubFest]);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/events`);
      setEvents(response.data);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    if (selectedSubFest !== 'ALL') {
      filtered = filtered.filter(e => e.sub_fest === selectedSubFest);
    }

    if (searchTerm) {
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  };

  const getSubFestColor = (subFest) => {
    return subFests.find(s => s.name === subFest)?.color || '#ffffff';
  };

  return (
    <div className="min-h-screen bg-[#030712]" data-testid="events-page">
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
          <h1 className="text-5xl font-black mb-4" data-testid="events-title">All Events</h1>
          <p className="text-gray-400 mb-8">Browse and register for events across all sub-fests</p>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events..."
                className="w-full bg-transparent border border-white/20 focus:border-white/80 pl-12 pr-4 py-3 text-white rounded-none"
                data-testid="search-input"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {subFests.map((fest) => (
                <button
                  key={fest.name}
                  onClick={() => setSelectedSubFest(fest.name)}
                  className={`px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap transition-all ${selectedSubFest === fest.name
                      ? 'bg-white/20 border-2'
                      : 'glass border border-white/10 hover:bg-white/5'
                    }`}
                  style={{
                    borderColor: selectedSubFest === fest.name ? fest.color : undefined
                  }}
                  data-testid={`filter-${fest.name.toLowerCase()}`}
                >
                  {fest.name === 'ALL' ? 'All' : fest.name.split('-')[1]}
                </button>
              ))}
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-400" data-testid="loading-state">Loading events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-400" data-testid="no-events-state">No events found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="glass p-6 rounded-none cursor-pointer hover:bg-white/5 transition-all event-card"
                  data-testid={`event-card-${event.id}`}
                >
                  <div
                    className="w-16 h-1 mb-4"
                    style={{ backgroundColor: getSubFestColor(event.sub_fest) }}
                  />

                  <h3 className="text-2xl font-bold mb-2">{event.name}</h3>

                  <p className="text-sm text-gray-500 mb-3 uppercase tracking-wider">
                    {event.sub_fest.split('-')[1]}
                  </p>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">{event.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type</span>
                      <span className="text-white capitalize">{event.event_type}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/events/${event.id}`);
                    }}
                    className="w-full mt-6 py-3 glass font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
                    data-testid={`view-details-${event.id}`}
                  >
                    View Details
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EventsPage;