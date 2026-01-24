import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Award, Search } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const ShortlistPage = () => {
  const navigate = useNavigate();
  const [shortlist, setShortlist] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchShortlist();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = shortlist.filter(entry =>
        entry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.roll_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredList(filtered);
    } else {
      setFilteredList(shortlist);
    }
  }, [searchTerm, shortlist]);

  const fetchShortlist = async () => {
    try {
      const response = await axios.get(`${API_URL}/shortlist`);
      setShortlist(response.data);
      setFilteredList(response.data);
    } catch (error) {
      toast.error('Failed to load shortlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712]" data-testid="shortlist-page">
      {/* Header */}
      <div className="glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <Award className="w-12 h-12 text-[#d946ef]" />
            <div>
              <h1 className="text-5xl font-black" data-testid="shortlist-title">Aakanksha Shortlist</h1>
              <p className="text-gray-400 mt-2">List of selected candidates for Cultural auditions</p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, roll number, or department..."
                className="w-full bg-transparent border border-white/20 focus:border-white/80 pl-12 pr-4 py-3 text-white rounded-none"
                data-testid="search-input"
              />
            </div>
          </div>

          {/* Shortlist Table */}
          {loading ? (
            <div className="text-center py-12 text-gray-400" data-testid="loading-state">Loading shortlist...</div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-12 text-gray-400" data-testid="empty-state">
              {searchTerm ? 'No results found' : 'Shortlist not yet published'}
            </div>
          ) : (
            <div className="glass rounded-none overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="shortlist-table">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">#</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Roll Number</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Department</th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((entry, idx) => (
                      <motion.tr
                        key={entry.id || idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-t border-white/10 hover:bg-white/5 transition-colors"
                        data-testid={`shortlist-row-${idx}`}
                      >
                        <td className="px-6 py-4 text-gray-400">{idx + 1}</td>
                        <td className="px-6 py-4 font-medium">{entry.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-300">{entry.roll_number || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-300">{entry.department || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-[#d946ef]/20 text-[#d946ef] text-xs font-bold uppercase tracking-wider">
                            {entry.status || 'Shortlisted'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ShortlistPage;