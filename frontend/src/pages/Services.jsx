import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/axios';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Services() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data } = await api.get('/services');
      setServices(data.services);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Nos Services
          </h1>
          <p className="text-xl text-gray-600">
            Découvrez nos différents types de soins en kinésithérapie
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="text-center mb-4">
                <div className="text-5xl mb-4">{service.icon || '💆'}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {service.name}
                </h3>
                <p className="text-gray-600">{service.description}</p>
              </div>

              {service.subservices && service.subservices.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold text-gray-700 mb-2">
                    Spécialités :
                  </p>
                  <ul className="space-y-1">
                    {service.subservices.map((sub, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start">
                        <span className="text-kine-600 mr-2">•</span>
                        {sub}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-kine-600">
                    {service.price} DH
                  </p>
                  <p className="text-sm text-gray-500">
                    {service.durationMinutes} minutes
                  </p>
                </div>
                <a
                  href="/book"
                  className="btn btn-primary"
                >
                  Réserver
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
