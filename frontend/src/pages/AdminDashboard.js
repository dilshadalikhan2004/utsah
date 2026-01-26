import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { LogOut, Plus, Upload, Download, Bell, Calendar, Users, Trophy, Pencil, Trash, Settings, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';


const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const AdminDashboard = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ events: 0, registrations: 0, users: 0 });
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedEventRegistrations, setSelectedEventRegistrations] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [showNotifForm, setShowNotifForm] = useState(false);
  const [showShortlistUpload, setShowShortlistUpload] = useState(false);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCoordinatorManager, setShowCoordinatorManager] = useState(false);
  const [coordinatorData, setCoordinatorData] = useState(null);

  const fetchCoordinatorData = async () => {
    try {
      const response = await axios.get(`${API_URL}/system/coordinators`);
      setCoordinatorData(response.data);
    } catch (error) {
      toast.error('Failed to load coordinator data');
    }
  };

  const openCoordinatorManager = () => {
    fetchCoordinatorData();
    setShowCoordinatorManager(true);
  };


  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    sub_fest: 'CULTURAL-AKANKSHA',
    event_type: 'individual',
    coordinators: [''],
    timing: '',
    venue: '',
    registration_deadline: '',
    capacity: 50,
    min_team_size: 1,
    max_team_size: 1,
    max_events_per_student: 3
  });

  const [notifForm, setNotifForm] = useState({
    title: '',
    message: '',
    image_url: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, regsRes, notifsRes] = await Promise.all([
        axios.get(`${API_URL}/events`),
        axios.get(`${API_URL}/registrations`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/notifications`)
      ]);

      setEvents(eventsRes.data);
      setRegistrations(regsRes.data);
      setNotifications(notifsRes.data);
      setStats({
        events: eventsRes.data.length,
        registrations: regsRes.data.length,
        users: 0
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...eventForm,
        coordinators: eventForm.coordinators.filter(c => c.trim() !== ''),
        registration_deadline: eventForm.registration_deadline ? new Date(eventForm.registration_deadline).toISOString() : new Date().toISOString(),
        venue: 'TBD',
        timing: 'TBD',
        capacity: 100
      };

      if (editingEventId) {
        await axios.put(`${API_URL}/events/${editingEventId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Event updated successfully!');
      } else {
        await axios.post(`${API_URL}/events`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Event created successfully!');
      }

      setShowEventForm(false);
      setEditingEventId(null);
      fetchData();
      setEventForm({
        name: '',
        description: '',
        sub_fest: 'CULTURAL-AKANKSHA',
        event_type: 'individual',
        coordinators: [''],
        timing: '',
        venue: '',
        registration_deadline: '',
        capacity: 50,
        min_team_size: 1,
        max_team_size: 1,
        max_events_per_student: 3
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save event');
    }
  };

  const handleEditClick = (event) => {
    setEventForm({
      name: event.name,
      description: event.description,
      sub_fest: event.sub_fest,
      event_type: event.event_type,
      coordinators: event.coordinators,
      timing: event.timing || '',
      venue: event.venue || '',
      registration_deadline: event.registration_deadline ? event.registration_deadline.slice(0, 16) : '',
      capacity: event.capacity || 50,
      min_team_size: event.min_team_size || 1,
      max_team_size: event.max_team_size || 1,
      max_events_per_student: event.max_events_per_student || 3
    });
    setEditingEventId(event.id);
    setShowEventForm(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to disable this event?')) return;
    try {
      await axios.delete(`${API_URL}/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Event disabled');
      fetchData();
    } catch (error) {
      toast.error('Failed to disable event');
    }
  };

  const handleCreateNotification = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/notifications`, notifForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Notification published!');
      setShowNotifForm(false);
      setNotifForm({ title: '', message: '', image_url: '' });
    } catch (error) {
      toast.error('Failed to create notification');
    }
  };

  const handleShortlistUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/shortlist/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(`Uploaded ${response.data.count} entries successfully!`);
      setShowShortlistUpload(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload shortlist');
    }
  };

  const handleExportData = async () => {
    try {
      const response = await axios.get(`${API_URL}/registrations/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'registrations.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    try {
      await axios.delete(`${API_URL}/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Notification deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const exportEventData = async (eventId, e) => {
    e.stopPropagation();
    try {
      const response = await axios.get(`${API_URL}/registrations/export?event_id=${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `registrations_${eventId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Event data exported');
    } catch (error) {
      toast.error('Failed to export event data');
    }
  };

  const handleSaveCoordinators = async () => {
    try {
      await axios.post(`${API_URL}/system/coordinators`, coordinatorData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Coordinator data updated successfully!');
      setShowCoordinatorManager(false);
    } catch (error) {
      toast.error('Failed to save coordinator data');
    }
  };

  const addCoordinatorGroup = () => {
    setCoordinatorData({
      ...coordinatorData,
      coordinators: [...coordinatorData.coordinators, { event: "New Event", faculty: [], students: [] }]
    });
  };

  const removeCoordinatorGroup = (index) => {
    const newCoords = [...coordinatorData.coordinators];
    newCoords.splice(index, 1);
    setCoordinatorData({ ...coordinatorData, coordinators: newCoords });
  };

  const updateCoordinatorGroup = (index, field, value) => {
    const newCoords = [...coordinatorData.coordinators];
    newCoords[index] = { ...newCoords[index], [field]: value };
    setCoordinatorData({ ...coordinatorData, coordinators: newCoords });
  };

  const addFaculty = (groupIndex) => {
    const newCoords = [...coordinatorData.coordinators];
    newCoords[groupIndex].faculty.push({ name: "", dept: "", phone: "" });
    setCoordinatorData({ ...coordinatorData, coordinators: newCoords });
  };

  const removeFaculty = (groupIndex, facIndex) => {
    const newCoords = [...coordinatorData.coordinators];
    newCoords[groupIndex].faculty.splice(facIndex, 1);
    setCoordinatorData({ ...coordinatorData, coordinators: newCoords });
  };

  const updateFaculty = (groupIndex, facIndex, field, value) => {
    const newCoords = [...coordinatorData.coordinators];
    newCoords[groupIndex].faculty[facIndex][field] = value;
    setCoordinatorData({ ...coordinatorData, coordinators: newCoords });
  };

  const addStudent = (groupIndex) => {
    const newCoords = [...coordinatorData.coordinators];
    newCoords[groupIndex].students.push({ name: "", year: "", phone: "" });
    setCoordinatorData({ ...coordinatorData, coordinators: newCoords });
  };

  const removeStudent = (groupIndex, stuIndex) => {
    const newCoords = [...coordinatorData.coordinators];
    newCoords[groupIndex].students.splice(stuIndex, 1);
    setCoordinatorData({ ...coordinatorData, coordinators: newCoords });
  };

  const updateStudent = (groupIndex, stuIndex, field, value) => {
    const newCoords = [...coordinatorData.coordinators];
    newCoords[groupIndex].students[stuIndex][field] = value;
    setCoordinatorData({ ...coordinatorData, coordinators: newCoords });
  };

  const handleDeleteRegistration = async (registrationId) => {
    if (!window.confirm("Are you sure you want to delete this registration? This cannot be undone.")) return;

    try {
      await axios.delete(`${API_URL}/registrations/${registrationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Registration deleted");

      // Update local state by filtering out the deleted registration
      setSelectedEventRegistrations(prev => ({
        ...prev,
        registrations: prev.registrations.filter(r => r.id !== registrationId)
      }));

      // Refresh global data to update counts
      fetchData();

    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete registration");
    }
  };

  const viewEventRegistrations = (eventId) => {
    const eventRegs = registrations.filter(reg => reg.event_id === eventId);
    const event = events.find(e => e.id === eventId);
    setSelectedEventRegistrations({ event, registrations: eventRegs });
    setShowRegistrationsModal(true);
  };

  return (
    <div className="min-h-screen bg-[#030712]" data-testid="admin-dashboard">
      {/* Header */}
      <div className="glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#d946ef] to-[#ec4899]" data-testid="admin-title">
            UTSAH Admin
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm text-gray-400">Admin</p>
              <p className="font-medium text-white">{user?.full_name}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 glass hover:bg-white/10 transition-colors flex items-center gap-2"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-6 rounded-none"
            data-testid="events-stat"
          >
            <Calendar className="w-10 h-10 text-[#d946ef] mb-3" />
            <p className="text-3xl font-black mb-1">{stats.events}</p>
            <p className="text-gray-400 text-sm">Total Events</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass p-6 rounded-none"
            data-testid="registrations-stat"
          >
            <Trophy className="w-10 h-10 text-[#f97316] mb-3" />
            <p className="text-3xl font-black mb-1">{stats.registrations}</p>
            <p className="text-gray-400 text-sm">Total Registrations</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass p-6 rounded-none"
            data-testid="users-stat"
          >
            <Users className="w-10 h-10 text-[#06b6d4] mb-3" />
            <p className="text-3xl font-black mb-1">Active</p>
            <p className="text-gray-400 text-sm">System Status</p>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-black mb-6" data-testid="admin-actions-title">Admin Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setShowEventForm(true)}
              className="glass p-6 rounded-none text-left hover:bg-white/5 transition-colors group"
              data-testid="create-event-button"
            >
              <Plus className="w-8 h-8 text-[#d946ef] mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold mb-2">Create Event</h3>
              <p className="text-gray-400 text-sm">Add new event</p>
            </button>

            <button
              onClick={() => setShowNotifForm(true)}
              className="glass p-6 rounded-none text-left hover:bg-white/5 transition-colors group"
              data-testid="create-notification-button"
            >
              <Bell className="w-8 h-8 text-[#f97316] mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold mb-2">Send Notification</h3>
              <p className="text-gray-400 text-sm">Publish announcement</p>
            </button>

            <button
              onClick={() => setShowShortlistUpload(true)}
              className="glass p-6 rounded-none text-left hover:bg-white/5 transition-colors group"
              data-testid="upload-shortlist-button"
            >
              <Upload className="w-8 h-8 text-[#06b6d4] mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold mb-2">Upload Shortlist</h3>
              <p className="text-gray-400 text-sm">Aakanksha results</p>
            </button>

            <button
              onClick={handleExportData}
              className="glass p-6 rounded-none text-left hover:bg-white/5 transition-colors group"
              data-testid="export-data-button"
            >
              <Download className="w-8 h-8 text-gray-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold mb-2">Export Data</h3>
              <p className="text-gray-400 text-sm">Download registrations</p>
            </button>

            <button
              onClick={openCoordinatorManager}
              className="glass p-6 rounded-none text-left hover:bg-white/5 transition-colors group"
              data-testid="manage-coordinators-button"
            >
              <Settings className="w-8 h-8 text-yellow-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold mb-2">Manage Coordinators</h3>
              <p className="text-gray-400 text-sm">Edit contact details</p>
            </button>

            <button
              onClick={() => navigate('/coordinators')}
              className="glass p-6 rounded-none text-left hover:bg-white/5 transition-colors group"
              data-testid="view-coordinators-button"
            >
              <Users className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold mb-2">Coordinators</h3>
              <p className="text-gray-400 text-sm">View Contact Details</p>
            </button>


          </div>
        </motion.div>

        {/* Events List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-3xl font-black mb-6" data-testid="all-events-title">All Events</h2>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading events...</div>
          ) : (
            <div>
              {['CULTURAL-AKANKSHA', 'SPORTS-AHWAAN', 'TECHNOLOGY-ANWESH', 'OTHER'].map(subFest => {
                const subFestEvents = events.filter(e => {
                  if (subFest === 'OTHER') return !['CULTURAL-AKANKSHA', 'SPORTS-AHWAAN', 'TECHNOLOGY-ANWESH'].includes(e.sub_fest);
                  return e.sub_fest === subFest;
                });

                if (subFestEvents.length === 0) return null;

                const subFestColor = {
                  'CULTURAL-AKANKSHA': 'text-[#d946ef]',
                  'SPORTS-AHWAAN': 'text-[#f97316]',
                  'TECHNOLOGY-ANWESH': 'text-[#06b6d4]',
                  'OTHER': 'text-gray-400'
                }[subFest];

                const subFestTitle = subFest === 'OTHER' ? 'Other Events' :
                  subFest === 'CULTURAL-AKANKSHA' ? 'CULTURAL - AKANKSHA' :
                    subFest === 'SPORTS-AHWAAN' ? 'SPORTS - AHWAAN' :
                      'TECHNOLOGY - ANWESH';

                return (
                  <div key={subFest} className="mb-8">
                    <h3 className={`text-xl font-bold mb-4 ${subFestColor}`}>{subFestTitle}</h3>
                    <div className="glass rounded-none overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Event</th>
                              <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider md:hidden">Sub-Fest</th>
                              <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Type</th>
                              <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Registrations</th>
                              <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Status</th>
                              <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subFestEvents.map((event) => (
                              <tr
                                key={event.id}
                                className="border-t border-white/10 hover:bg-white/5 transition-colors"
                                data-testid={`event-row-${event.id}`}
                              >
                                <td className="px-6 py-4 font-medium">{event.name}</td>
                                <td className="px-6 py-4 text-gray-300 md:hidden">{event.sub_fest.split('-')[1]}</td>
                                <td className="px-6 py-4 text-gray-300 capitalize">{event.event_type}</td>
                                <td className="px-6 py-4 text-gray-300">{event.registered_count}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider ${event.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                                    }`}>
                                    {event.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => viewEventRegistrations(event.id)}
                                      className="p-2 glass hover:bg-white/10 transition-colors text-gray-300"
                                      title="View Registrations"
                                    >
                                      <Users className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={(e) => exportEventData(event.id, e)}
                                      className="p-2 glass hover:bg-green-500/20 text-green-400 transition-colors"
                                      title="Export CSV"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleEditClick(event)}
                                      className="p-2 glass hover:bg-blue-500/20 text-blue-400 transition-colors"
                                      title="Edit Event"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteEvent(event.id)}
                                      className="p-2 glass hover:bg-red-500/20 text-red-400 transition-colors"
                                      title="Disable Event"
                                    >
                                      <Trash className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" data-testid="event-form-modal">
          <div className="glass p-8 rounded-none max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowEventForm(false)}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h2 className="text-3xl font-black mb-6">{editingEventId ? 'Edit Event' : 'Create New Event'}</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <input
                type="text"
                placeholder="Event Name"
                value={eventForm.name}
                onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                className="w-full bg-transparent border-b border-white/20 focus:border-white/80 px-4 py-3 text-white"
                required
                data-testid="event-name-input"
              />
              <textarea
                placeholder="Description"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                className="w-full bg-transparent border border-white/20 focus:border-white/80 px-4 py-3 text-white min-h-24"
                data-testid="event-description-input"
              />
              <select
                value={eventForm.sub_fest}
                onChange={(e) => setEventForm({ ...eventForm, sub_fest: e.target.value })}
                className="w-full bg-[#0f172a] border-b border-white/20 focus:border-white/80 px-4 py-3 text-white"
                data-testid="event-subfest-select"
              >
                <option value="CULTURAL-AKANKSHA">CULTURAL - AKANKSHA</option>
                <option value="SPORTS-AHWAAN">SPORTS - AHWAAN</option>
                <option value="TECHNOLOGY-ANWESH">TECHNOLOGY - ANWESH</option>
              </select>
              <select
                value={eventForm.event_type}
                onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                className="w-full bg-[#0f172a] border-b border-white/20 focus:border-white/80 px-4 py-3 text-white"
                data-testid="event-type-select"
              >
                <option value="individual">Individual</option>
                <option value="team">Team</option>
              </select>

              <div className="text-gray-400 text-sm mt-2 mb-1">Registration Deadline</div>
              <input
                type="datetime-local"
                value={eventForm.registration_deadline}
                onChange={(e) => setEventForm({ ...eventForm, registration_deadline: e.target.value })}
                className="w-full bg-[#0f172a] border-b border-white/20 focus:border-white/80 px-4 py-3 text-white"
                data-testid="event-deadline-input"
              />

              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowEventForm(false)}
                  className="px-6 py-3 glass hover:bg-white/10"
                  data-testid="cancel-event-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#d946ef] hover:bg-[#ec4899] font-bold uppercase tracking-wider"
                  data-testid="submit-event-button"
                >
                  {editingEventId ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Form Modal */}
      {showNotifForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" data-testid="notification-form-modal">
          <div className="glass p-8 rounded-none max-w-2xl w-full">
            <h2 className="text-3xl font-black mb-6">Create Notification</h2>
            <form onSubmit={handleCreateNotification} className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={notifForm.title}
                onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                className="w-full bg-transparent border-b border-white/20 focus:border-white/80 px-4 py-3 text-white"
                required
                data-testid="notification-title-input"
              />
              <textarea
                placeholder="Message"
                value={notifForm.message}
                onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                className="w-full bg-transparent border border-white/20 focus:border-white/80 px-4 py-3 text-white min-h-32"
                required
                data-testid="notification-message-input"
              />
              <input
                type="url"
                placeholder="Image URL (optional)"
                value={notifForm.image_url}
                onChange={(e) => setNotifForm({ ...notifForm, image_url: e.target.value })}
                className="w-full bg-transparent border-b border-white/20 focus:border-white/80 px-4 py-3 text-white"
                data-testid="notification-image-input"
              />

              <div className="mt-8 border-t border-white/10 pt-6">
                <h3 className="text-xl font-bold mb-4">Existing Notifications</h3>
                {notifications.length === 0 ? (
                  <p className="text-gray-400">No active notifications.</p>
                ) : (
                  <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    {notifications.map(notif => (
                      <div key={notif.id} className="glass p-4 rounded-none flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold">{notif.title}</h4>
                          <p className="text-sm text-gray-400 line-clamp-2">{notif.message}</p>
                          <span className="text-xs text-gray-500">{new Date(notif.created_at).toLocaleDateString()}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteNotification(notif.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete Notification"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowNotifForm(false)}
                  className="px-6 py-3 glass hover:bg-white/10"
                  data-testid="cancel-notification-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#d946ef] hover:bg-[#ec4899] font-bold uppercase tracking-wider"
                  data-testid="submit-notification-button"
                >
                  Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shortlist Upload Modal */}
      {showShortlistUpload && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" data-testid="shortlist-upload-modal">
          <div className="glass p-8 rounded-none max-w-md w-full">
            <h2 className="text-3xl font-black mb-6">Upload Shortlist</h2>
            <p className="text-gray-400 mb-6">Upload an Excel file with columns: name, roll_number, department, status</p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleShortlistUpload}
              className="w-full text-white"
              data-testid="shortlist-file-input"
            />
            <button
              onClick={() => setShowShortlistUpload(false)}
              className="mt-6 w-full px-6 py-3 glass hover:bg-white/10"
              data-testid="cancel-shortlist-button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Registrations Modal */}
      {showRegistrationsModal && selectedEventRegistrations && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" data-testid="registrations-modal">
          <div className="glass p-8 rounded-none max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-black">{selectedEventRegistrations.event.name}</h2>
                <p className="text-gray-400 mt-2">
                  Total Registrations: {selectedEventRegistrations.registrations.length}
                </p>
              </div>
              <button
                onClick={() => setShowRegistrationsModal(false)}
                className="px-6 py-3 glass hover:bg-white/10"
                data-testid="close-registrations-modal"
              >
                Close
              </button>
            </div>

            {selectedEventRegistrations.registrations.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No registrations yet</div>
            ) : (
              <div className="space-y-6">
                {selectedEventRegistrations.registrations.map((reg, idx) => (
                  <div key={reg.id} className="glass p-6 rounded-none border border-white/10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold">Registration #{idx + 1}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          Registered by: {reg.student_email}
                        </p>
                        <p className="text-sm text-gray-400">
                          Date: {new Date(reg.registered_at).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteRegistration(reg.id)}
                        className="p-2 glass hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Delete Registration"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Individual Event */}
                    {!reg.team_members && (
                      <div className="glass p-4 rounded-none">
                        <p className="text-sm text-gray-400 mb-2">Individual Participant</p>
                        <p className="font-medium">{reg.student_email}</p>
                      </div>
                    )}

                    {/* Team Event */}
                    {reg.team_members && reg.team_members.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-400 mb-3 font-medium">
                          Team Members ({reg.team_members.length}):
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {reg.team_members.map((member, mIdx) => (
                            <div key={mIdx} className="glass p-4 rounded-none border border-white/5">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-lg">{member.full_name}</h4>
                                <span className="text-xs px-2 py-1 bg-white/10 rounded">
                                  Member {mIdx + 1}
                                </span>
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-gray-500">Roll:</span>
                                    <span className="ml-2 text-gray-300">{member.roll_number}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Year:</span>
                                    <span className="ml-2 text-gray-300">{member.year}</span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-gray-500">Dept:</span>
                                    <span className="ml-2 text-gray-300">{member.department}</span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-gray-500">Mobile:</span>
                                    <span className="ml-2 text-gray-300">{member.mobile_number}</span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-gray-500">Email:</span>
                                    <span className="ml-2 text-gray-300 break-all">{member.email}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      {/* Coordinator Manager Modal */}
      {showCoordinatorManager && coordinatorData && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" data-testid="coordinator-manager-modal">
          <div className="glass p-8 rounded-none max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-black mb-6">Manage Coordinators</h2>

            <div className="space-y-6">
              {coordinatorData.coordinators.map((group, gIdx) => (
                <div key={gIdx} className="glass p-6 border border-white/20">
                  <div className="flex justify-between items-center mb-4">
                    <input
                      type="text"
                      value={group.event}
                      onChange={(e) => updateCoordinatorGroup(gIdx, 'event', e.target.value)}
                      className="text-xl font-bold bg-transparent border-b border-transparent focus:border-white outline-none w-1/2 p-2"
                      placeholder="Event Name"
                    />
                    <button onClick={() => removeCoordinatorGroup(gIdx)} className="text-red-400 text-sm hover:text-red-300">Remove Group</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Faculty */}
                    <div>
                      <h4 className="font-bold text-lg mb-2 text-[#d946ef]">Faculty</h4>
                      {group.faculty.map((fac, fIdx) => (
                        <div key={fIdx} className="flex gap-2 mb-2 items-center">
                          <input type="text" placeholder="Name" className="bg-white/5 p-2 w-1/3 text-sm focus:outline-none focus:bg-white/10" value={fac.name} onChange={(e) => updateFaculty(gIdx, fIdx, 'name', e.target.value)} />
                          <input type="text" placeholder="Dept" className="bg-white/5 p-2 w-1/4 text-sm focus:outline-none focus:bg-white/10" value={fac.dept} onChange={(e) => updateFaculty(gIdx, fIdx, 'dept', e.target.value)} />
                          <input type="text" placeholder="Phone" className="bg-white/5 p-2 w-1/4 text-sm focus:outline-none focus:bg-white/10" value={fac.phone} onChange={(e) => updateFaculty(gIdx, fIdx, 'phone', e.target.value)} />
                          <button onClick={() => removeFaculty(gIdx, fIdx)} className="text-red-400 hover:text-red-300 px-2">×</button>
                        </div>
                      ))}
                      <button onClick={() => addFaculty(gIdx)} className="text-sm text-[#d946ef] mt-2 hover:text-[#ec4899]">+ Add Faculty</button>
                    </div>

                    {/* Students */}
                    <div>
                      <h4 className="font-bold text-lg mb-2 text-[#06b6d4]">Students</h4>
                      {group.students.map((stu, sIdx) => (
                        <div key={sIdx} className="flex gap-2 mb-2 items-center">
                          <input type="text" placeholder="Name" className="bg-white/5 p-2 w-1/3 text-sm focus:outline-none focus:bg-white/10" value={stu.name} onChange={(e) => updateStudent(gIdx, sIdx, 'name', e.target.value)} />
                          <input type="text" placeholder="Year" className="bg-white/5 p-2 w-1/4 text-sm focus:outline-none focus:bg-white/10" value={stu.year} onChange={(e) => updateStudent(gIdx, sIdx, 'year', e.target.value)} />
                          <input type="text" placeholder="Phone" className="bg-white/5 p-2 w-1/4 text-sm focus:outline-none focus:bg-white/10" value={stu.phone} onChange={(e) => updateStudent(gIdx, sIdx, 'phone', e.target.value)} />
                          <button onClick={() => removeStudent(gIdx, sIdx)} className="text-red-400 hover:text-red-300 px-2">×</button>
                        </div>
                      ))}
                      <button onClick={() => addStudent(gIdx)} className="text-sm text-[#06b6d4] mt-2 hover:text-[#22d3ee]">+ Add Student</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between items-center pt-6 border-t border-white/10">
              <button onClick={addCoordinatorGroup} className="px-4 py-2 border border-white/20 hover:bg-white/10 transition-colors pointer-events-auto">+ Add Event Group</button>
              <div className="flex gap-4">
                <button onClick={() => setShowCoordinatorManager(false)} className="px-6 py-3 glass hover:bg-white/10 transition-colors">Cancel</button>
                <button onClick={handleSaveCoordinators} className="px-6 py-3 bg-[#d946ef] hover:bg-[#ec4899] font-bold uppercase tracking-wider transition-colors">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;