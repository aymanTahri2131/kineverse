import { create } from 'zustand';
import api from '../lib/axios';

const useAuthStore = create((set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/login', credentials);
          
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          return data;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // Register
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/register', userData);
          
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          return data;
        } catch (error) {
          set({
            error: error.response?.data?.message || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // Logout
      logout: async () => {
        try {
          await api.post('/auth/logout', { userId: get().user?.id });
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      // Update user
      updateUser: (user) => set({ user }),

      // Clear error
      clearError: () => set({ error: null }),

      // Verify token and get user info from backend
      verifyAndSetUser: async () => {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const storedUser = localStorage.getItem('user');

        if (!accessToken && !refreshToken) {
          // No tokens, user not authenticated
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return false;
        }

        try {
          // Try to get current user info from backend
          const { data } = await api.get('/auth/me');
          
          set({
            user: data.user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Save user to localStorage for faster subsequent loads
          localStorage.setItem('user', JSON.stringify(data.user));
          
          return true;
        } catch (error) {
          console.error('Token verification failed:', error);
          
          // Check if it's a network error (backend not available)
          if (!error.response) {
            console.warn('Backend not available, using cached user data');
            
            // Use cached user data if available
            if (storedUser && accessToken) {
              try {
                const user = JSON.parse(storedUser);
                set({
                  user,
                  accessToken,
                  refreshToken,
                  isAuthenticated: true,
                  isLoading: false,
                });
                return true;
              } catch (parseError) {
                console.error('Failed to parse stored user:', parseError);
              }
            }
          }
          
          // If verification fails with 401, try to refresh token
          if (error.response?.status === 401 && refreshToken) {
            try {
              const { data } = await api.post('/auth/refresh', { refreshToken });
              
              localStorage.setItem('accessToken', data.accessToken);
              
              // Retry getting user info
              try {
                const userResponse = await api.get('/auth/me');
                
                set({
                  user: userResponse.data.user,
                  accessToken: data.accessToken,
                  refreshToken,
                  isAuthenticated: true,
                  isLoading: false,
                });

                localStorage.setItem('user', JSON.stringify(userResponse.data.user));
                
                return true;
              } catch (retryError) {
                // If retry fails but we have stored user, use it
                if (storedUser) {
                  try {
                    const user = JSON.parse(storedUser);
                    set({
                      user,
                      accessToken: data.accessToken,
                      refreshToken,
                      isAuthenticated: true,
                      isLoading: false,
                    });
                    return true;
                  } catch (parseError) {
                    console.error('Failed to parse stored user:', parseError);
                  }
                }
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              
              // Only clear if refresh token is actually invalid (401)
              if (refreshError.response?.status === 401) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                
                set({
                  user: null,
                  accessToken: null,
                  refreshToken: null,
                  isAuthenticated: false,
                  isLoading: false,
                });
                
                return false;
              }
              
              // For other errors (network, etc.), keep user logged in with cached data
              if (storedUser && refreshToken) {
                try {
                  const user = JSON.parse(storedUser);
                  set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                    isLoading: false,
                  });
                  return true;
                } catch (parseError) {
                  console.error('Failed to parse stored user:', parseError);
                }
              }
            }
          }
          
          // Only clear tokens if we got a proper 401 response (invalid token)
          if (error.response?.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
            
            return false;
          }
          
          // For other errors (network, 500, etc.), keep user logged in with cached data
          if (storedUser) {
            try {
              const user = JSON.parse(storedUser);
              set({
                user,
                accessToken,
                refreshToken,
                isAuthenticated: true,
                isLoading: false,
              });
              return true;
            } catch (parseError) {
              console.error('Failed to parse stored user:', parseError);
            }
          }
          
          // No cached data, clear everything
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
          
          return false;
        }
      },

      // Initialize from localStorage
      initialize: async () => {
        set({ isLoading: true });
        await get().verifyAndSetUser();
      },
}));

export default useAuthStore;
