import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const GalleryPage = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubFest, setSelectedSubFest] = useState('ALL');
  const [selectedImage, setSelectedImage] = useState(null);

  const subFests = [
    { name: 'ALL', color: '#ffffff' },
    { name: 'CULTURAL-AKANKSHA', color: '#d946ef' },
    { name: 'SPORTS-AHWAAN', color: '#f97316' },
    { name: 'TECHNOLOGY-ANWESH', color: '#06b6d4' }
  ];

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const response = await axios.get(`${API_URL}/gallery`);
      setImages(response.data);
    } catch (error) {
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = selectedSubFest === 'ALL'
    ? images
    : images.filter(img => img.sub_fest === selectedSubFest);

  return (
    <div className="min-h-screen bg-[#030712]" data-testid="gallery-page">
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
            <ImageIcon className="w-12 h-12 text-[#d946ef]" />
            <div>
              <h1 className="text-5xl font-black" data-testid="gallery-title">Gallery</h1>
              <p className="text-gray-400 mt-2">Relive the magical moments of UTSAH</p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-3 mb-8 overflow-x-auto">
            {subFests.map((fest) => (
              <button
                key={fest.name}
                onClick={() => setSelectedSubFest(fest.name)}
                className={`px-6 py-3 font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  selectedSubFest === fest.name
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

          {/* Gallery Grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-400" data-testid="loading-state">Loading gallery...</div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-12 text-gray-400" data-testid="empty-state">No images found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredImages.map((image, idx) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedImage(image)}
                  className="relative aspect-square overflow-hidden cursor-pointer group"
                  data-testid={`gallery-image-${image.id}`}
                >
                  <img
                    src={image.image_url}
                    alt={image.caption || 'Gallery image'}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      {image.caption && <p className="text-white font-medium">{image.caption}</p>}
                      <p className="text-sm text-gray-300 mt-1">{image.sub_fest.split('-')[1]}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6"
          data-testid="image-modal"
        >
          <motion.img
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            src={selectedImage.image_url}
            alt={selectedImage.caption}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </div>
  );
};

export default GalleryPage;