import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Star, 
  Calendar,
  Navigation,
  AlertCircle,
  Search,
  Filter,
  X,
  ChevronRight,
  Building2,
  Syringe
} from 'lucide-react';
import TopNavbar from './TopNavbar';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_URL } from '../../../api';

const Clinics = () => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedVaccine, setSelectedVaccine] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState('');

  // Extract unique cities and clinic types from actual data
  const cities = [...new Set(clinics.map(clinic => clinic.city).filter(Boolean))];
  const clinicTypes = [...new Set(clinics.map(clinic => clinic.clinicType).filter(Boolean))];

  // Extract unique vaccine names from all clinics
  const vaccineNames = [...new Set(
    clinics.flatMap(clinic =>
      (clinic.availableVaccines || [])
        .filter(v => v.vaccineId && v.quantity > 0)
        .map(v => v.vaccineId.name)
        .filter(Boolean)
    )
  )];

  // Placeholder images for clinics
  const placeholderImages = [
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=500&h=300&fit=crop',
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=500&h=300&fit=crop'
  ];

  // Fetch clinics from API
  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found. Please log in again.');
        toast.error('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/V1/clinics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setClinics(data.clinics || []);
        if (data.clinics && data.clinics.length === 0) {
          toast.info('No clinics found in the database');
        }
      } else {
        setError(data.message || 'Failed to fetch clinics');
        toast.error(data.message || 'Failed to fetch clinics');
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
      setError('Network error. Please check your connection and try again.');
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter clinics based on search and filters
  const filteredClinics = clinics.filter(clinic => {
    const matchesSearch = !searchTerm || 
      clinic.clinicName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.district?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = !selectedCity || clinic.city === selectedCity;
    const matchesType = !selectedType || clinic.clinicType === selectedType;
    const matchesVaccine = !selectedVaccine || 
      (clinic.availableVaccines || []).some(v => v.vaccineId?.name === selectedVaccine && v.quantity > 0);
    
    return matchesSearch && matchesCity && matchesType && matchesVaccine;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCity('');
    setSelectedType('');
    setSelectedVaccine('');
  };

  // Format days display
  const formatDays = (openDays) => {
    if (!openDays || openDays.length === 0) return 'Not specified';
    const dayMap = {
      'Monday': 'Mon',
      'Tuesday': 'Tue',
      'Wednesday': 'Wed',
      'Thursday': 'Thu',
      'Friday': 'Fri',
      'Saturday': 'Sat',
      'Sunday': 'Sun'
    };
    return openDays.map(day => dayMap[day] || day.slice(0, 3));
  };

  return (
    <>
      <TopNavbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                  Vaccination Centers
                </h1>
                <p className="text-gray-600 text-lg">
                  Find nearby clinics and schedule your vaccination
                </p>
              </div>
              {!loading && clinics.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
                  <span className="text-blue-600 font-semibold">{filteredClinics.length}</span>
                  <span className="text-gray-500 ml-1">centers found</span>
                </div>
              )}
            </div>

            {/* Search and Filter Bar - Only show if there are clinics */}
            {!loading && clinics.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md p-4 mt-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by clinic name, city, or address..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  {(cities.length > 0 || clinicTypes.length > 0) && (
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center justify-center gap-2 px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                    >
                      <Filter className="w-4 h-4" />
                      <span>Filters</span>
                      {(selectedCity || selectedType || selectedVaccine) && (
                        <span className="ml-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {(selectedCity ? 1 : 0) + (selectedType ? 1 : 0) + (selectedVaccine ? 1 : 0)}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Filter Options */}
                {showFilters && (cities.length > 0 || clinicTypes.length > 0 || vaccineNames.length > 0) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {cities.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                          <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All Cities</option>
                            {cities.map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {clinicTypes.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Clinic Type</label>
                          <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All Types</option>
                            {clinicTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {vaccineNames.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Vaccine</label>
                          <select
                            value={selectedVaccine}
                            onChange={(e) => setSelectedVaccine(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All Vaccines</option>
                            {vaccineNames.map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    {(selectedCity || selectedType || selectedVaccine || searchTerm) && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={clearFilters}
                          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-4 h-4" />
                          Clear all filters
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="text-center py-20 bg-white rounded-2xl shadow-md">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Unable to Load Clinics</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <button
                onClick={fetchClinics}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* No Clinics Found in Database */}
          {!loading && !error && clinics.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl shadow-md">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Clinics Available</h3>
              <p className="text-gray-500">
                There are no vaccination centers registered in the system yet.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Please check back later or contact the administrator.
              </p>
            </div>
          )}

          {/* Clinics Grid - Only show if there are clinics */}
          {!loading && !error && clinics.length > 0 && (
            <>
              {filteredClinics.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl shadow-md">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No clinics found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredClinics.map((clinic, index) => (
                    <div
                      key={clinic._id}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group"
                    >
                      {/* Image Section */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={placeholderImages[index % placeholderImages.length]}
                          alt={clinic.clinicName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-semibold text-blue-600">
                          {clinic.clinicType || 'Clinic'}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition line-clamp-2">
                            {clinic.clinicName}
                          </h3>
                          <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {clinic.description || 'Professional vaccination services with experienced medical staff.'}
                        </p>

                        {/* Details */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span className="truncate">{clinic.address}, {clinic.city}</span>
                          </div>
                          {clinic.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <span>{clinic.phone}</span>
                            </div>
                          )}
                          {clinic.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <span className="truncate">{clinic.email}</span>
                            </div>
                          )}
                          {clinic.openTime && clinic.closeTime && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <span>{clinic.openTime} - {clinic.closeTime}</span>
                            </div>
                          )}
                        </div>

                        {/* Operating Days */}
                        {clinic.openDays && clinic.openDays.length > 0 && (
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-1">
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                                const isOpen = clinic.openDays.includes(day);
                                return (
                                  <span
                                    key={day}
                                    className={`text-xs px-2 py-1 rounded ${
                                      isOpen
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}
                                  >
                                    {day.slice(0, 3)}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Available Vaccines */}
                        {clinic.availableVaccines && clinic.availableVaccines.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                              <Syringe className="w-3 h-3" /> Available Vaccines
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {clinic.availableVaccines.filter(v => v.vaccineId && v.quantity > 0).map((v, idx) => (
                                <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                                  {v.vaccineId.name} ({v.quantity})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Link
                            to="/patient/appointments"
                            state={{ clinicId: clinic._id, clinicName: clinic.clinicName }}
                            className="flex-1 text-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm flex items-center justify-center gap-1"
                          >
                            Book Appointment<ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Clinics;