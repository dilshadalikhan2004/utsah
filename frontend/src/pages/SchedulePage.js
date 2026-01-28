import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, ScrollText, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const SchedulePage = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${API_URL}/system/coordinators`);
                setData(response.data);
            } catch (error) {
                toast.error('Failed to load schedule data');
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
                        Event Schedule
                    </h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">

                {['AKANKSHA', 'AHWAAN', 'ANWESH'].map((subfest) => {
                    const subfestItems = (data.schedule || []).filter(item =>
                        item.category === subfest || (!item.category && subfest === 'AKANKSHA')
                    );

                    const colors = {
                        'AKANKSHA': '#d946ef',
                        'AHWAAN': '#f97316',
                        'ANWESH': '#06b6d4'
                    };

                    return (
                        <motion.div
                            key={subfest}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`glass p-8 rounded-none border-l-4`}
                            style={{ borderColor: colors[subfest] }}
                        >
                            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                                <Calendar className="w-8 h-8" style={{ color: colors[subfest] }} />
                                {subfest} Schedule
                            </h2>

                            {subfestItems.length === 0 ? (
                                <div className="text-center py-8 glass bg-white/5 mx-auto max-w-lg">
                                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                                    <p className="text-xl font-bold text-gray-300">Schedule to be released soon</p>
                                    <p className="text-gray-500 text-sm mt-2">Stay tuned for updates!</p>
                                </div>
                            ) : (
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
                                            {subfestItems.map((item, idx) => (
                                                <tr key={idx} className="border-b border-white/10 hover:bg-white/5">
                                                    <td className="py-4 px-4 font-mono" style={{ color: colors[subfest] }}>{item.date}</td>
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
                            )}
                        </motion.div>
                    );
                })}

                {/* Rules Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass p-8 rounded-none border-l-4 border-[#8b5cf6]"
                >
                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                        <ScrollText className="w-8 h-8 text-[#8b5cf6]" />
                        General Rules & Guidelines
                    </h2>

                    <div className="space-y-6 text-gray-300">
                        <ul className="list-disc pl-6 space-y-2">
                            {data.rules && data.rules.map((rule, idx) => (
                                <li key={idx} className="leading-relaxed">{rule}</li>
                            ))}
                        </ul>

                        {data.additional_rules && data.additional_rules.length > 0 && (
                            <div className="bg-white/5 p-6 rounded-none mt-4">
                                <h3 className="text-[#8b5cf6] font-bold mb-4 flex items-center gap-2">
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

            </div>
        </div>
    );
};

export default SchedulePage;
