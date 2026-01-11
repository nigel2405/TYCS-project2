import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/api';
import { animatePageLoad, animateTextReveal } from '../../utils/animations';
import GlassCard from '../../components/common/GlassCard';
import GlassButton from '../../components/common/GlassButton';
import PageHeader from '../../components/common/PageHeader';
import SkeletonLoader from '../../components/common/SkeletonLoader';

const ConsumerMarketplace = () => {
  const [gpus, setGPUs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    manufacturer: '',
    minVRAM: '',
    maxVRAM: '',
    maxPrice: '',
    minPrice: '',
    search: '',
    sortBy: 'pricePerHour',
    sortOrder: 'asc',
  });
  const [focusedField, setFocusedField] = useState(null);

  const navigate = useNavigate();
  const pageRef = useRef(null);
  const cardsRef = useRef([]);
  const filtersRef = useRef(null);

  const fetchGPUs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params[key] = filters[key];
      });

      const res = await axios.get('/consumer/gpus', { params });
      setGPUs(res.data.data.gpus || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch GPUs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchGPUs();
  }, [fetchGPUs]);

  useEffect(() => {
    if (pageRef.current) {
      animatePageLoad(pageRef.current);
    }
    if (filtersRef.current) {
      setTimeout(() => animateTextReveal(filtersRef.current), 200);
    }
    cardsRef.current.forEach((card, index) => {
      if (card) {
        setTimeout(() => animatePageLoad(card), index * 50);
      }
    });
  }, [gpus]);

  const handleRequestSession = async (gpuId) => {
    if (!window.confirm('Request a session for this GPU?')) return;

    try {
      const res = await axios.post('/consumer/sessions/request', {
        gpuId,
        workloadType: 'other',
      });
      alert('Session requested successfully!');
      navigate(`/sessions/${res.data.data.session._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request session');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  if (loading) {
    return (
      <div className="relative z-10">
        <PageHeader title="GPU Marketplace" subtitle="Browse and rent available GPUs" />
        <div className="max-w-7xl mx-auto px-5">
          <SkeletonLoader className="h-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonLoader key={i} className="h-96" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="relative z-10" style={{ opacity: 0 }}>
      <PageHeader title="GPU Marketplace" subtitle="Browse and rent available GPUs" />

      <div className="max-w-7xl mx-auto px-5 pb-12">
        {error && (
          <div className="glass-card bg-red-500/20 border-red-500/50 p-4 rounded-xl mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <GlassCard
          ref={filtersRef}
          className="mb-8 cursor-glow"
          cursorGlow
          style={{ opacity: 0 }}
        >
          <h3 className="text-xl font-bold text-white mb-6">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'search', label: 'Search', type: 'text', placeholder: 'Search by name, model...' },
              { name: 'manufacturer', label: 'Manufacturer', type: 'select', options: ['', 'NVIDIA', 'AMD', 'Intel'] },
              { name: 'minVRAM', label: 'Min VRAM (GB)', type: 'number', placeholder: 'e.g., 8' },
              { name: 'maxVRAM', label: 'Max VRAM (GB)', type: 'number', placeholder: 'e.g., 24' },
              { name: 'minPrice', label: 'Min Price ($/hr)', type: 'number', step: '0.01', placeholder: 'e.g., 1.00' },
              { name: 'maxPrice', label: 'Max Price ($/hr)', type: 'number', step: '0.01', placeholder: 'e.g., 10.00' },
              { name: 'sortBy', label: 'Sort By', type: 'select', options: ['pricePerHour', 'vram', 'rating.average', 'createdAt'] },
              { name: 'sortOrder', label: 'Order', type: 'select', options: ['asc', 'desc'] },
            ].map((field) => (
              <div key={field.name} className="relative">
                {field.type === 'select' ? (
                  <>
                    <select
                      name={field.name}
                      value={filters[field.name]}
                      onChange={handleFilterChange}
                      onFocus={() => setFocusedField(field.name)}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-4 py-4 rounded-xl border border-white/20 bg-white/5 backdrop-blur-md text-white focus:outline-none focus:border-primary-500/50 focus:shadow-glow-primary transition-all duration-300 appearance-none cursor-pointer z-10 relative"
                    >
                      {field.name === 'manufacturer' ? (
                        <>
                          <option value="" className="bg-gray-900">All</option>
                          {field.options.slice(1).map((opt) => (
                            <option key={opt} value={opt} className="bg-gray-900">{opt}</option>
                          ))}
                        </>
                      ) : field.name === 'sortBy' ? (
                        <>
                          <option value="pricePerHour" className="bg-gray-900">Price</option>
                          <option value="vram" className="bg-gray-900">VRAM</option>
                          <option value="rating.average" className="bg-gray-900">Rating</option>
                          <option value="createdAt" className="bg-gray-900">Newest</option>
                        </>
                      ) : (
                        <>
                          <option value="asc" className="bg-gray-900">Ascending</option>
                          <option value="desc" className="bg-gray-900">Descending</option>
                        </>
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={filters[field.name]}
                    onChange={handleFilterChange}
                    onFocus={() => setFocusedField(field.name)}
                    onBlur={() => setFocusedField(null)}
                    placeholder={field.placeholder || ' '}
                    step={field.step}
                    className="w-full px-4 py-4 rounded-xl border border-white/20 bg-white/5 backdrop-blur-md text-white placeholder-transparent focus:outline-none focus:border-primary-500/50 focus:shadow-glow-primary transition-all duration-300 z-10 relative"
                    style={{ caretColor: '#25CCF7' }}
                  />
                )}
                <label
                  className={`absolute left-4 transition-all duration-300 pointer-events-none z-20 ${
                    focusedField === field.name || filters[field.name]
                      ? 'top-2 text-xs text-primary-500'
                      : 'top-4 text-base text-white/60'
                  }`}
                >
                  {field.label}
                </label>
              </div>
            ))}
          </div>
        </GlassCard>

        {gpus.length === 0 ? (
          <GlassCard>
            <p className="text-white/70 text-center py-8">No GPUs found matching your criteria.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gpus.map((gpu, index) => (
              <GlassCard
                key={gpu._id}
                ref={(el) => (cardsRef.current[index] = el)}
                className="cursor-glow gradient-border"
                cursorGlow
                style={{ opacity: 0 }}
              >
                <h3 className="text-xl font-bold text-white mb-4">{gpu.name}</h3>
                <div className="space-y-2 mb-5">
                  <p className="text-white/70"><strong className="text-white">Manufacturer:</strong> {gpu.manufacturer}</p>
                  <p className="text-white/70"><strong className="text-white">Model:</strong> {gpu.model}</p>
                  <p className="text-white/70"><strong className="text-white">VRAM:</strong> {gpu.vram} GB</p>
                  <p className="text-white/70"><strong className="text-white">Clock Speed:</strong> {gpu.clockSpeed} MHz</p>
                  {gpu.cudaCores > 0 && <p className="text-white/70"><strong className="text-white">CUDA Cores:</strong> {gpu.cudaCores}</p>}
                  <p className="text-white/70">
                    <strong className="text-white">Price:</strong>
                    <span className="text-secondary-500 text-xl font-bold ml-2"> ${gpu.pricePerHour}/hour</span>
                  </p>
                  {gpu.rating && gpu.rating.count > 0 && (
                    <p className="text-white/70"><strong className="text-white">Rating:</strong> {gpu.rating.average.toFixed(1)}/5 ({gpu.rating.count} reviews)</p>
                  )}
                  <p className="text-white/70"><strong className="text-white">Provider:</strong> {gpu.provider?.username || 'Unknown'}</p>
                </div>
                <GlassButton
                  variant="primary"
                  className="w-full"
                  onClick={() => handleRequestSession(gpu._id)}
                >
                  Request Session
                </GlassButton>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumerMarketplace;
