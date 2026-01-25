import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, GraduationCap, Building2, Calendar, Clock, MapPin, ScrollText, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const CoordinatorsPage = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${API_URL}/system/coordinators`);
                setData(response.data);
            } catch (error) {
                toast.error('Failed to load coordinator data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#030712] flex items-center justify-center text-white">
                Loading...
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="min-h-screen bg-[#030712] text-white">
            {/* Header */}
            <div className="glass border-b border-white/10 sticky top-0 z-10 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#d946ef] to-[#ec4899]">
                        Audition Details & Coordinators
                    </h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">

                {/* Rules Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass p-8 rounded-none border-l-4 border-[#f97316]"
                >
                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                        <ScrollText className="w-8 h-8 text-[#f97316]" />
                        Audition Rules & Regulations
                    </h2>

                    <div className="space-y-6 text-gray-300">
                        <ul className="list-disc pl-6 space-y-2">
                            {data.rules && data.rules.map((rule, idx) => (
                                <li key={idx} className="leading-relaxed">{rule}</li>
                            ))}
                        </ul>

                        {data.additional_rules && data.additional_rules.length > 0 && (
                            <div className="bg-white/5 p-6 rounded-none mt-4">
                                <h3 className="text-[#f97316] font-bold mb-4 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    Additional Guidelines
                                </h3>
                                <ul className="list-disc pl-6 space-y-2">
                                    {data.additional_rules.map((rule, idx) => (
                                        <li key={idx} className="leading-relaxed">{rule}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Schedule Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass p-8 rounded-none border-l-4 border-[#06b6d4]"
                >
                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-[#06b6d4]" />
                        Audition Schedule & Venue
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/20 text-gray-400 uppercase text-sm">
                                    <th className="py-4 px-4">Date</th>
                                    <th className="py-4 px-4">Time</th>
                                    <th className="py-4 px-4">Venue</th>
                                    <th className="py-4 px-4">Event</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.schedule && data.schedule.map((item, idx) => (
                                    <tr key={idx} className="border-b border-white/10 hover:bg-white/5">
                                        <td className="py-4 px-4 font-mono text-[#06b6d4]">{item.date}</td>
                                        <td className="py-4 px-4 flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-500" />
                                            {item.time}
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-gray-500" />
                                                {item.venue}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 font-bold">{item.event}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Coordinators Grid */}
                <div>
                    <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-[#d946ef]" />
                        Event Coordinators
                    </h2>

                    <div className="grid gap-8">
                        {data.coordinators && data.coordinators.map((item, index) => (
                            <motion.div
                                key={item.event}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + (index * 0.05) }}
                                className="glass overflow-hidden rounded-none border border-white/10"
                            >
                                <div className="bg-white/5 px-6 py-4 border-b border-white/10">
                                    <h2 className="text-xl font-bold text-[#d946ef]">{item.event}</h2>
                                </div>

                                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Faculty Section */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Building2 className="w-4 h-4" />
                                            Faculty Coordinators
                                        </h3>
                                        <div className="space-y-4">
                                            {item.faculty.map((faculty, fIdx) => (
                                                <div key={fIdx} className="bg-white/5 p-4 rounded-none border-l-2 border-[#d946ef]">
                                                    <p className="font-bold text-lg mb-1">{faculty.name}</p>
                                                    <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                                                        <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded">
                                                            <Building2 className="w-3 h-3" />
                                                            {faculty.dept}
                                                        </span>
                                                        {faculty.phone !== '-' && (
                                                            <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-purple-300">
                                                                <Phone className="w-3 h-3" />
                                                                {faculty.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Student Section */}
                                    {item.students.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <GraduationCap className="w-4 h-4" />
                                                Student Coordinators
                                            </h3>
                                            <div className="space-y-4">
                                                {item.students.map((student, sIdx) => (
                                                    <div key={sIdx} className="bg-white/5 p-4 rounded-none border-l-2 border-[#06b6d4]">
                                                        <p className="font-bold text-lg mb-1">{student.name}</p>
                                                        <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                                                            <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded">
                                                                <GraduationCap className="w-3 h-3" />
                                                                {student.year} Year
                                                            </span>
                                                            <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-cyan-300">
                                                                <Phone className="w-3 h-3" />
                                                                {student.phone}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoordinatorsPage;
