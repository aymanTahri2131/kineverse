import { create } from 'zustand';
import api from '../lib/axios';

const useAppointmentStore = create((set, get) => ({
  appointments: [],
  currentAppointment: null,
  isLoading: false,
  error: null,

  // Fetch user appointments
  fetchUserAppointments: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/appointments/user/${userId}`);
      set({ appointments: data.appointments, isLoading: false });
      return data.appointments;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch appointments',
        isLoading: false 
      });
      throw error;
    }
  },

  // Fetch single appointment
  fetchAppointment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/appointments/${id}`);
      set({ currentAppointment: data.appointment, isLoading: false });
      return data.appointment;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch appointment',
        isLoading: false 
      });
      throw error;
    }
  },

  // Create appointment
  createAppointment: async (appointmentData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/appointments', appointmentData);
      set((state) => ({
        appointments: [data.appointment, ...state.appointments],
        isLoading: false,
      }));
      return data.appointment;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to create appointment',
        isLoading: false 
      });
      throw error;
    }
  },

  // Update appointment
  updateAppointment: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.put(`/appointments/${id}`, updates);
      set((state) => ({
        appointments: state.appointments.map((apt) =>
          apt._id === id ? data.appointment : apt
        ),
        currentAppointment: data.appointment,
        isLoading: false,
      }));
      return data.appointment;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to update appointment',
        isLoading: false 
      });
      throw error;
    }
  },

  // Cancel appointment
  cancelAppointment: async (id, reason) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post(`/appointments/${id}/cancel`, { reason });
      set((state) => ({
        appointments: state.appointments.map((apt) =>
          apt._id === id ? data.appointment : apt
        ),
        isLoading: false,
      }));
      return data.appointment;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to cancel appointment',
        isLoading: false 
      });
      throw error;
    }
  },

  // Confirm appointment (kine)
  confirmAppointment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post(`/appointments/${id}/confirm`);
      set((state) => ({
        appointments: state.appointments.map((apt) =>
          apt._id === id ? data.appointment : apt
        ),
        isLoading: false,
      }));
      return data.appointment;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to confirm appointment',
        isLoading: false 
      });
      throw error;
    }
  },

  // Mark payment (kine)
  markPayment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post(`/appointments/${id}/payment`);
      set((state) => ({
        appointments: state.appointments.map((apt) =>
          apt._id === id ? data.appointment : apt
        ),
        isLoading: false,
      }));
      return data.appointment;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to mark payment',
        isLoading: false 
      });
      throw error;
    }
  },

  // Fetch available appointments (no kine assigned)
  fetchAvailableAppointments: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/appointments/available');
      set({ isLoading: false });
      return data.appointments || [];
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch available appointments',
        isLoading: false 
      });
      throw error;
    }
  },

  // Take/Accept an available appointment (kine)
  takeAppointment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post(`/appointments/${id}/take`);
      set((state) => ({
        appointments: [data.appointment, ...state.appointments],
        isLoading: false,
      }));
      return data.appointment;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to take appointment',
        isLoading: false 
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useAppointmentStore;
