import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { LogOut, Plus, Upload, Download, Bell, Calendar, Users, Trophy, Pencil, Trash, Settings, ArrowLeft, RefreshCw, FileText } from 'lucide-react';
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
  const [showScheduleManager, setShowScheduleManager] = useState(false);
  const [activeScheduleTab, setActiveScheduleTab] = useState('AKANKSHA');

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

  const openScheduleManager = () => {
    fetchCoordinatorData();
    setShowScheduleManager(true);
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
        users: 0,
        akanksha: regsRes.data.filter(r => r.sub_fest === 'CULTURAL-AKANKSHA').length,
        ahwaan: regsRes.data.filter(r => r.sub_fest === 'SPORTS-AHWAAN').length,
        anwesh: regsRes.data.filter(r => r.sub_fest === 'TECHNOLOGY-ANWESH').length
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
        // Default to far future deadline if not set, as user relies on manual toggle
        registration_deadline: eventForm.registration_deadline ? new Date(eventForm.registration_deadline).toISOString() : '2099-12-31T23:59:59.000Z',
        venue: 'TBD',
        timing: 'TBD',
        capacity: 10000
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

      // Force reload to ensure fresh data
      window.location.reload();
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
    // Helper to format ISO date to local datetime-local string
    const formatToLocalDatetime = (isoString) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    setEventForm({
      name: event.name,
      description: event.description,
      sub_fest: event.sub_fest,
      event_type: event.event_type,
      coordinators: event.coordinators,
      timing: event.timing || '',
      venue: event.venue || '',
      registration_deadline: formatToLocalDatetime(event.registration_deadline),
      capacity: event.capacity || 50,
      min_team_size: event.min_team_size || 1,
      max_team_size: event.max_team_size || 1,
      max_events_per_student: event.max_events_per_student || 3
    });
    setEditingEventId(event.id);
    setShowEventForm(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to permanently delete this event? This action cannot be undone.')) return;
    try {
      await axios.delete(`${API_URL}/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Event deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const handleToggleRegistration = async (event) => {
    try {
      const newStatus = !event.is_registration_open;
      const updates = { is_registration_open: newStatus };

      // If opening registration and deadline has passed, extend it
      if (newStatus) {
        const currentDeadline = new Date(event.registration_deadline);
        if (currentDeadline < new Date()) {
          // Extend to end of fest (approx) or far future
          updates.registration_deadline = '2026-02-15T23:59:59.000Z';
          toast.info('Registration opened and deadline extended to Feb 15th');
        }
      }

      await axios.put(`${API_URL}/events/${event.id}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!updates.registration_deadline) {
        toast.success(`Registration ${newStatus ? 'opened' : 'closed'} successfully`);
      }
      fetchData();
    } catch (error) {
      toast.error('Failed to update registration status');
    }
  };

  const handleBulkToggle = async (subFest, shouldOpen) => {
    if (!window.confirm(`Are you sure you want to ${shouldOpen ? 'OPEN' : 'CLOSE'} registrations for ALL ${subFest} events?`)) return;

    try {
      const subFestEvents = events.filter(e => e.sub_fest === subFest);
      const updates = subFestEvents.map(event => {
        const payload = { is_registration_open: shouldOpen };
        if (shouldOpen) {
          const currentDeadline = new Date(event.registration_deadline);
          if (currentDeadline < new Date()) {
            payload.registration_deadline = '2026-02-15T23:59:59.000Z';
          }
        }
        return axios.put(`${API_URL}/events/${event.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      });

      await Promise.all(updates);
      toast.success(`All ${subFest.split('-')[1]} registrations ${shouldOpen ? 'opened' : 'closed'} successfully`);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update some events");
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

  const [shortlistTitle, setShortlistTitle] = useState('');

  const handleShortlistUpload = async (e) => {
    e.preventDefault(); // Prevent form submission
    const fileInput = document.getElementById('shortlist-file');
    const file = fileInput?.files[0];

    if (!file || !shortlistTitle) {
      toast.error("Please provide both a title and a file");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', shortlistTitle);

    try {
      const response = await axios.post(`${API_URL}/shortlist/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(response.data.message);
      setShowShortlistUpload(false);
      setShortlistTitle('');
      if (fileInput) fileInput.value = ''; // Reset file input
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

  const handleSyncCounts = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/system/sync-counts`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(response.data.message);
      fetchData();
    } catch (error) {
      toast.error('Failed to sync counts');
      setLoading(false);
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

  const handleSaveSchedule = async () => {
    try {
      await axios.post(`${API_URL}/system/coordinators`, coordinatorData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Schedule updated successfully!');
      setShowScheduleManager(false);
    } catch (error) {
      toast.error('Failed to save schedule');
    }
  };

  const addScheduleItem = () => {
    setCoordinatorData({
      ...coordinatorData,
      schedule: [...(coordinatorData.schedule || []), {
        date: "",
        time: "",
        venue: "",
        event: "",
        category: activeScheduleTab === 'AHWAAN' ? 'ANWESH' : activeScheduleTab === 'ANWESH' ? 'AHWAAN' : activeScheduleTab
      }]
    });
  };

  const removeScheduleItem = (index) => {
    const newSchedule = [...coordinatorData.schedule];
    newSchedule.splice(index, 1);
    setCoordinatorData({ ...coordinatorData, schedule: newSchedule });
  };

  const updateScheduleItem = (index, field, value) => {
    const newSchedule = [...coordinatorData.schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setCoordinatorData({ ...coordinatorData, schedule: newSchedule });
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
      await axios.delete(`${API_URL}/registrations/${encodeURIComponent(registrationId)}`, {
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

  const [showRulebookManager, setShowRulebookManager] = useState(false);
  const [selectedEventForRulebooks, setSelectedEventForRulebooks] = useState(null);
  const [rulebookForm, setRulebookForm] = useState({ title: '' });

  const handleOpenRulebookManager = (event) => {
    setSelectedEventForRulebooks(event);
    setShowRulebookManager(true);
  };

  const handleUploadRulebook = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('rulebook-file');
    const file = fileInput?.files[0];

    if (!file || !rulebookForm.title) {
      toast.error("Please provide both title and file");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', rulebookForm.title);

    const uploadUrl = `${API_URL}/events/${selectedEventForRulebooks.id}/rulebooks`;
    console.log("Uploading to:", uploadUrl, "Event ID:", selectedEventForRulebooks?.id);

    try {
      const response = await axios.post(uploadUrl, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Rulebook uploaded");

      // Update local state immediately
      const updatedEvent = {
        ...selectedEventForRulebooks,
        rulebooks: [...(selectedEventForRulebooks.rulebooks || []), response.data]
      };
      setSelectedEventForRulebooks(updatedEvent);

      // Update global events list
      setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e));

      setRulebookForm({ title: '' });
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error("Upload failed", error);
      toast.error(error.response?.data?.detail || 'Failed to upload rulebook: ' + error.message);
    }
  };

  const handleDeleteRulebook = async (url) => {
    if (!window.confirm("Are you sure you want to delete this rulebook?")) return;

    try {
      await axios.delete(`${API_URL}/events/${selectedEventForRulebooks.id}/rulebooks?url=${encodeURIComponent(url)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Rulebook deleted");

      // Update local state
      const updatedEvent = {
        ...selectedEventForRulebooks,
        rulebooks: selectedEventForRulebooks.rulebooks.filter(r => r.url !== url)
      };
      setSelectedEventForRulebooks(updatedEvent);
      setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e));

    } catch (error) {
      toast.error("Failed to delete rulebook");
    }
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

        {/* Sub-Fest Registration Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="glass p-6 rounded-none border-l-4 border-l-[#d946ef]">
            <h3 className="text-xl font-bold text-white mb-2">Akanksha</h3>
            <p className="text-[#d946ef] text-sm uppercase mb-4">Cultural</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-white">{stats.akanksha || 0}</span>
              <span className="text-gray-500 mb-1">registrations</span>
            </div>
          </div>

          <div className="glass p-6 rounded-none border-l-4 border-l-[#06b6d4]">
            <h3 className="text-xl font-bold text-white mb-2">Anwesh</h3>
            <p className="text-[#06b6d4] text-sm uppercase mb-4">Technology</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-white">{stats.anwesh || 0}</span>
              <span className="text-gray-500 mb-1">registrations</span>
            </div>
          </div>

          <div className="glass p-6 rounded-none border-l-4 border-l-[#f97316]">
            <h3 className="text-xl font-bold text-white mb-2">Ahwaan</h3>
            <p className="text-[#f97316] text-sm uppercase mb-4">Sports</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-white">{stats.ahwaan || 0}</span>
              <span className="text-gray-500 mb-1">registrations</span>
            </div>
          </div>
        </motion.div>

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
              onClick={openScheduleManager}
              className="glass p-6 rounded-none text-left hover:bg-white/5 transition-colors group"
              data-testid="manage-schedule-button"
            >
              <Calendar className="w-8 h-8 text-pink-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold mb-2">Manage Schedule</h3>
              <p className="text-gray-400 text-sm">Edit event timings</p>
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

            <button
              onClick={handleSyncCounts}
              className="glass p-6 rounded-none text-left hover:bg-white/5 transition-colors group"
              data-testid="sync-counts-button"
            >
              <RefreshCw className="w-8 h-8 text-blue-400 mb-3 group-hover:rotate-180 transition-transform duration-700" />
              <h3 className="text-lg font-bold mb-2">Sync Data</h3>
              <p className="text-gray-400 text-sm">Fix registration counts</p>
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
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`text-xl font-bold ${subFestColor}`}>{subFestTitle}</h3>
                      {subFest === 'SPORTS-AHWAAN' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleBulkToggle(subFest, true)}
                            className="px-3 py-1 bg-green-500/20 text-green-500 text-xs font-bold uppercase rounded border border-green-500/30 hover:bg-green-500/30 transition-colors"
                          >
                            Open All
                          </button>
                          <button
                            onClick={() => handleBulkToggle(subFest, false)}
                            className="px-3 py-1 bg-red-500/20 text-red-500 text-xs font-bold uppercase rounded border border-red-500/30 hover:bg-red-500/30 transition-colors"
                          >
                            Close All
                          </button>
                        </div>
                      )}
                    </div>
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
                              <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Reg. Status</th>
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
                                  <button
                                    onClick={() => handleToggleRegistration(event)}
                                    className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded border hover:bg-opacity-20 transition-colors ${event.is_registration_open
                                      ? 'bg-blue-500/20 text-blue-500 border-blue-500/30'
                                      : 'bg-gray-500/20 text-gray-500 border-gray-500/30'
                                      }`}
                                  >
                                    {event.is_registration_open ? 'Open' : 'Closed'}
                                  </button>
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
                                      onClick={() => handleOpenRulebookManager(event)}
                                      className="p-2 glass hover:bg-purple-500/20 text-purple-400 transition-colors"
                                      title="Manage Rulebooks"
                                    >
                                      <FileText className="w-4 h-4" />
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
      </div >

      {/* Rulebook Manager Modal */}
      {
        showRulebookManager && selectedEventForRulebooks && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" data-testid="rulebook-manager-modal">
            <div className="glass p-8 rounded-none max-w-lg w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Manage Rulebooks</h2>
                <button
                  onClick={() => setShowRulebookManager(false)}
                  className="text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <p className="text-gray-400 mb-4 text-sm">Event: <span className="text-white font-bold">{selectedEventForRulebooks.name}</span></p>

              {/* Upload Form */}
              <form onSubmit={handleUploadRulebook} className="mb-8 border-b border-white/10 pb-6">
                <h3 className="text-lg font-bold mb-3 text-[#d946ef]">Upload New Rulebook</h3>
                <input
                  type="text"
                  placeholder="Rulebook Title (e.g., Line Follower)"
                  value={rulebookForm.title}
                  onChange={(e) => setRulebookForm({ ...rulebookForm, title: e.target.value })}
                  className="w-full bg-transparent border-b border-white/20 focus:border-white/80 px-4 py-2 text-white mb-3"
                  required
                />
                <div className="flex gap-2">
                  <input
                    id="rulebook-file"
                    type="file"
                    accept=".pdf"
                    className="flex-1 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-[#d946ef] file:text-white hover:file:bg-[#ec4899]"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#d946ef] hover:bg-[#ec4899] font-bold text-sm uppercase tracking-wider"
                  >
                    Upload
                  </button>
                </div>
              </form>

              {/* Existing Rulebooks */}
              <div>
                <h3 className="text-lg font-bold mb-4">Existing Rulebooks</h3>
                {selectedEventForRulebooks.rulebooks && selectedEventForRulebooks.rulebooks.length > 0 ? (
                  <div className="space-y-3">
                    {selectedEventForRulebooks.rulebooks.map((rb, idx) => (
                      <div key={idx} className="glass p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#d946ef]" />
                          <span className="font-medium">{rb.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={rb.url.startsWith('http') ? rb.url : (rb.url.startsWith('/') ? `${process.env.REACT_APP_BACKEND_URL}${rb.url}` : `https://${rb.url}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:underline"
                          >
                            View
                          </a>
                          <button
                            onClick={() => handleDeleteRulebook(rb.url)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Delete"
                          >
                            <Trash className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-sm">No rulebooks uploaded yet.</p>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Event Form Modal */}
      {
        showEventForm && (
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



                <div className="grid grid-cols-2 gap-4">

                  {eventForm.event_type === 'team' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Min Team</div>
                        <input
                          type="number"
                          value={eventForm.min_team_size}
                          onChange={(e) => setEventForm({ ...eventForm, min_team_size: parseInt(e.target.value) })}
                          className="w-full bg-transparent border-b border-white/20 focus:border-white/80 py-3 text-white text-center"
                        />
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1">Max Team</div>
                        <input
                          type="number"
                          value={eventForm.max_team_size}
                          onChange={(e) => setEventForm({ ...eventForm, max_team_size: parseInt(e.target.value) })}
                          className="w-full bg-transparent border-b border-white/20 focus:border-white/80 py-3 text-white text-center"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Coordinators Section */}
                <div className="space-y-2">
                  <label className="text-gray-400 text-sm">Coordinators</label>
                  {eventForm.coordinators.map((coord, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Coordinator ${index + 1} (e.g., Dr. John Doe)`}
                        value={coord}
                        onChange={(e) => {
                          const newCoords = [...eventForm.coordinators];
                          newCoords[index] = e.target.value;
                          setEventForm({ ...eventForm, coordinators: newCoords });
                        }}
                        className="flex-1 bg-transparent border-b border-white/20 focus:border-white/80 px-4 py-2 text-white"
                      />
                      {eventForm.coordinators.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newCoords = eventForm.coordinators.filter((_, i) => i !== index);
                            setEventForm({ ...eventForm, coordinators: newCoords });
                          }}
                          className="px-3 py-2 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEventForm({ ...eventForm, coordinators: [...eventForm.coordinators, ''] })}
                    className="text-sm text-[#d946ef] hover:text-[#ec4899] transition-colors"
                  >
                    + Add Another Coordinator
                  </button>
                </div>



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
        )
      }

      {/* Notification Form Modal */}
      {
        showNotifForm && (
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
        )
      }

      {/* Shortlist Upload Modal */}
      {
        showShortlistUpload && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" data-testid="shortlist-upload-modal">
            <div className="glass p-8 rounded-none max-w-md w-full">
              <h2 className="text-3xl font-black mb-6">Upload Shortlist</h2>
              <p className="text-gray-400 mb-6">Upload an Excel file with columns: name, roll_number, department, status</p>
              <input
                type="text"
                placeholder="Event/Round Title (e.g., Solo Song Final)"
                value={shortlistTitle}
                onChange={(e) => setShortlistTitle(e.target.value)}
                className="w-full bg-transparent border-b border-white/20 focus:border-white/80 px-4 py-3 text-white mb-4"
                data-testid="shortlist-title-input"
              />
              <input
                id="shortlist-file"
                type="file"
                accept=".xlsx,.xls"
                className="w-full text-white"
                data-testid="shortlist-file-input"
              />
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowShortlistUpload(false)}
                  className="flex-1 px-6 py-3 glass hover:bg-white/10"
                  data-testid="cancel-shortlist-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShortlistUpload}
                  className="flex-1 px-6 py-3 bg-[#d946ef] hover:bg-[#ec4899] font-bold uppercase tracking-wider"
                  data-testid="submit-shortlist-button"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Registrations Modal */}
      {
        showRegistrationsModal && selectedEventRegistrations && (
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

                      {/* Selected Sub Events (Robotics) */}
                      {reg.selected_sub_events && reg.selected_sub_events.length > 0 && (
                        <div className="glass p-4 rounded-none mb-4 border border-[#d946ef]/30 bg-[#d946ef]/5">
                          <p className="text-sm text-[#d946ef] mb-2 font-bold uppercase tracking-wider">Selected Categories</p>
                          <div className="flex flex-wrap gap-2">
                            {reg.selected_sub_events.map((cat, cIdx) => (
                              <span key={cIdx} className="px-3 py-1 bg-[#d946ef]/20 border border-[#d946ef]/50 rounded text-sm text-white">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

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
        )
      }


      {/* Coordinator Manager Modal */}
      {
        showCoordinatorManager && coordinatorData && (
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
        )
      }

      {/* Schedule Manager Modal */}
      {
        showScheduleManager && coordinatorData && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" data-testid="schedule-manager-modal">
            <div className="glass p-8 rounded-none max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-3xl font-black mb-6">Manage Schedule</h2>

              {/* Tabs */}
              <div className="flex gap-2 mb-8 border-b border-white/10 pb-2">
                {['AKANKSHA', 'AHWAAN', 'ANWESH'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveScheduleTab(tab)}
                    className={`px-6 py-2 rounded-none font-bold uppercase transition-colors ${activeScheduleTab === tab
                      ? 'bg-[#d946ef] text-white'
                      : 'glass text-gray-400 hover:text-white'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 font-bold text-gray-400 uppercase text-sm mb-2 px-2">
                  <div className="col-span-3">Date</div>
                  <div className="col-span-3">Time</div>
                  <div className="col-span-3">Venue</div>
                  <div className="col-span-2">Event</div>
                  <div className="col-span-1"></div>
                </div>

                {(coordinatorData.schedule || [])
                  .map((item, originalIndex) => ({ ...item, originalIndex }))
                  .filter(item => {
                    let targetCategory = activeScheduleTab;
                    if (activeScheduleTab === 'AHWAAN') targetCategory = 'ANWESH';
                    else if (activeScheduleTab === 'ANWESH') targetCategory = 'AHWAAN';

                    return (item.category === targetCategory) || (!item.category && targetCategory === 'AKANKSHA');
                  })
                  .map((item, idx) => (
                    <div key={item.originalIndex} className="grid grid-cols-12 gap-4 items-center bg-white/5 p-2 border border-white/10">
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Date"
                          className="w-full bg-transparent p-2 text-sm focus:outline-none border-b border-transparent focus:border-white/50"
                          value={item.date}
                          onChange={(e) => updateScheduleItem(item.originalIndex, 'date', e.target.value)}
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Time"
                          className="w-full bg-transparent p-2 text-sm focus:outline-none border-b border-transparent focus:border-white/50"
                          value={item.time}
                          onChange={(e) => updateScheduleItem(item.originalIndex, 'time', e.target.value)}
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="Venue"
                          className="w-full bg-transparent p-2 text-sm focus:outline-none border-b border-transparent focus:border-white/50"
                          value={item.venue}
                          onChange={(e) => updateScheduleItem(item.originalIndex, 'venue', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Event"
                          className="w-full bg-transparent p-2 text-sm focus:outline-none border-b border-transparent focus:border-white/50"
                          value={item.event}
                          onChange={(e) => updateScheduleItem(item.originalIndex, 'event', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <button onClick={() => removeScheduleItem(item.originalIndex)} className="text-red-400 hover:text-red-300 p-2">✕</button>
                      </div>
                    </div>
                  ))}

                {/* Empty State */}
                {(coordinatorData.schedule || []).filter(item => (item.category === activeScheduleTab) || (!item.category && activeScheduleTab === 'AKANKSHA')).length === 0 && (
                  <div className="text-center py-8 text-gray-500 italic">
                    <p>No schedule entries for {activeScheduleTab}</p>
                    <p className="text-xs mt-1">Click "Add Entry" to create one.</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-between items-center pt-6 border-t border-white/10">
                <button onClick={addScheduleItem} className="px-4 py-2 border border-white/20 hover:bg-white/10 transition-colors pointer-events-auto">+ Add Entry</button>
                <div className="flex gap-4">
                  <button onClick={() => setShowScheduleManager(false)} className="px-6 py-3 glass hover:bg-white/10 transition-colors">Cancel</button>
                  <button onClick={handleSaveSchedule} className="px-6 py-3 bg-[#d946ef] hover:bg-[#ec4899] font-bold uppercase tracking-wider transition-colors">Save Schedule</button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default AdminDashboard;