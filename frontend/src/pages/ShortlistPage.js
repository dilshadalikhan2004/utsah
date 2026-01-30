import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Award, Search, Calendar, FileText, ChevronRight, X, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const ShortlistPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [shortlists, setShortlists] = useState([]);
  const [selectedShortlist, setSelectedShortlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchShortlists();
  }, []);

  const fetchShortlists = async () => {
    try {
      const response = await axios.get(`${API_URL}/shortlists`);
      setShortlists(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load shortlists');
    } finally {
      setLoading(false);
    }
  };

  const handleShortlistClick = async (id) => {
    setDetailsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/shortlists/${id}`);
      setSelectedShortlist(response.data);
    } catch (error) {
      toast.error('Failed to load details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this shortlist?')) return;

    try {
      await axios.delete(`${API_URL}/shortlists/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Shortlist deleted');
      fetchShortlists();
      if (selectedShortlist?.id === id) setSelectedShortlist(null);
    } catch (error) {
      toast.error('Failed to delete shortlist');
    }
  };

  // Helper to get columns from data
  const getColumns = (data) => {
    if (!data || data.length === 0) return [];
    // Get all unique keys except 'id'
    const keys = new Set();
    data.forEach(item => {
      Object.keys(item).forEach(k => {
        if (k !== 'id' && k !== '_id') keys.add(k);
      });
    });
    return Array.from(keys);
  };

  // Filter entries in the selected shortlist
  const filteredEntries = selectedShortlist?.entries?.filter(entry => {
    if (!searchTerm) return true;
    return Object.values(entry).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  return (
    <div className="min-h-screen bg-[#030712] text-white" data-testid="shortlist-page">
      {/* Header */}
      <div className="glass border-b border-white/10 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => selectedShortlist ? setSelectedShortlist(null) : navigate('/')}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#d946ef] to-[#06b6d4]">
              {selectedShortlist ? selectedShortlist.title : 'Event Results & Shortlists'}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!selectedShortlist ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <Award className="w-10 h-10 text-[#d946ef]" />
                <div>
                  <h2 className="text-3xl font-black">Published Results</h2>
                  <p className="text-gray-400">Select an event to view the shortlist</p>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="glass h-48 animate-pulse rounded-none"></div>
                  ))}
                </div>
              ) : shortlists.length === 0 ? (
                <div className="text-center py-20 bg-white/5 border border-white/10">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No results published yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {shortlists.map((list, idx) => (
                    <motion.div
                      key={list.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => handleShortlistClick(list.id)}
                      className="group glass p-6 rounded-none cursor-pointer border border-white/10 hover:border-[#d946ef]/50 transition-all hover:-translate-y-1 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[#d946ef]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* Delete Button for Admin */}
                      {user?.role === 'admin' && (
                        <button
                          onClick={(e) => handleDelete(e, list.id)}
                          className="absolute top-2 right-2 z-20 p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded transition-colors"
                          title="Delete Shortlist"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}

                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-white/5 rounded-none">
                            <FileText className="w-6 h-6 text-[#d946ef]" />
                          </div>
                          <Calendar className="w-4 h-4 text-gray-500" />
                        </div>

                        <h3 className="text-xl font-bold mb-2 group-hover:text-[#d946ef] transition-colors line-clamp-2">
                          {list.title}
                        </h3>

                        <p className="text-sm text-gray-400 mb-4">
                          Published: {new Date(list.uploaded_at).toLocaleDateString()}
                        </p>

                        <div className="flex items-center text-sm font-bold text-gray-300 group-hover:text-white mt-auto">
                          View List <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search in list..."
                    className="w-full bg-white/5 border border-white/10 focus:border-white/50 pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>
                <div className="text-sm text-gray-400">
                  Total Entries: <span className="text-white font-bold">{selectedShortlist.entries?.length || 0}</span>
                </div>
              </div>

              {/* Table */}
              <div className="glass rounded-none overflow-hidden border border-white/10">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400 w-16">#</th>
                        {getColumns(selectedShortlist.entries).map(col => (
                          <th key={col} className="p-4 text-xs font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap">
                            {col.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((entry, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 text-gray-500 text-sm">{idx + 1}</td>
                          {getColumns(selectedShortlist.entries).map(col => (
                            <td key={col} className="p-4 text-sm whitespace-nowrap">
                              {col.toLowerCase() === 'status' ? (
                                <span className="px-3 py-1 bg-[#d946ef]/20 text-[#d946ef] text-xs font-bold uppercase tracking-wider rounded">
                                  {entry[col] || 'Shortlisted'}
                                </span>
                              ) : (
                                <span className="text-gray-300">{entry[col] !== null ? String(entry[col]) : '-'}</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {filteredEntries.length === 0 && (
                        <tr>
                          <td colSpan={100} className="p-8 text-center text-gray-500">
                            No matching entries found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {detailsLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#d946ef] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default ShortlistPage;