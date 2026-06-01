import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import licenseApi from './licenseApi';

/**
 * License store for managing license state and operations.
 * Uses Zustand for state management with devtools support.
 */
const useLicenseStore = create(
  devtools(
    (set, get) => ({
      // State
      licenseKey: '',
      status: 'unknown', // 'unknown', 'valid', 'invalid', 'expired', 'inactive', 'no_license'
      isActive: false,
      isLoading: false,
      error: null,
      lastChecked: null,
      fromCache: false,
      licenseData: {},

      // UI state
      isActivating: false,
      isDeactivating: false,
      isRefreshing: false,
      isUpgrading: false,
      upgradeAvailable: false,
      downloadUrl: '',

      // Upgrade progress
      upgradeProgress: null,
      
      // Actions
      
      /**
       * Set the license key (for UI updates).
       */
      setLicenseKey: (key) => {
        set({ licenseKey: key, error: null });
      },

      /**
       * Clear any existing error.
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Activate a license key.
       */
      activateLicense: async (licenseKey) => {
        const { setLicenseKey } = get();

        // Check if we're in lite version and should show upgrade progress immediately
        const isLiteVersion = window.wpchatLicense?.is_lite;

        const initialState = {
          isActivating: true,
          isLoading: true,
          error: null
        };

        // If lite version, immediately show upgrade progress
        if (isLiteVersion) {
          initialState.isUpgrading = true;
          initialState.upgradeProgress = {
            status: 'starting',
            message: 'Initializing upgrade process...',
            percentage: 0
          };
        }

        set(initialState);

        try {
          // Validate license key format first
          const validation = licenseApi.validateLicenseKey(licenseKey);
          if (!validation.isValid) {
            throw new Error(validation.message);
          }

          const response = await licenseApi.activateLicense(licenseKey);
          
          if (response.success) {
            const updates = {
              licenseKey: licenseKey.trim(),
              status: response.status,
              isActive: response.isActive,
              licenseData: response.data,
              lastChecked: new Date().toISOString(),
              fromCache: false,
              error: null
            };

            // Check if upgrade is happening (Free to Pro)
            if (response.data?.download_url && window.wpchatLicense?.is_lite) {
              // Keep showing upgrade progress
              updates.isUpgrading = true;

              // Mark as completed - the UpgradeProgress component will handle the animation to 100%
              updates.upgradeProgress = {
                status: 'completed',
                message: 'Upgrade completed successfully!',
                percentage: 100
              };


              // The UpgradeProgress component will handle confetti and reload
              // No need for polling since backend upgrade happens during activation
            }

            set(updates);

            // Also update the license key in the UI
            setLicenseKey(licenseKey.trim());
          } else {
            const errorMessage = licenseApi.getErrorMessage(
              response.error_code, 
              response.message || 'License activation failed'
            );
            throw new Error(errorMessage);
          }

          return response;
        } catch (error) {
          set({
            error: error.message,
            status: 'invalid',
            isUpgrading: false,  // Stop showing upgrade progress on error
            upgradeProgress: null
          });
          throw error;
        } finally {
          set({
            isActivating: false,
            isLoading: false
          });
        }
      },


      /**
       * Deactivate the current license.
       */
      deactivateLicense: async (licenseKey = null) => {
        set({ 
          isDeactivating: true,
          isLoading: true,
          error: null 
        });

        try {
          const response = await licenseApi.deactivateLicense(licenseKey);
          
          if (response.success) {
            set({
              licenseKey: '',
              status: 'no_license',
              isActive: false,
              licenseData: {},
              lastChecked: new Date().toISOString(),
              fromCache: false,
              error: null
            });
          } else {
            const errorMessage = licenseApi.getErrorMessage(
              response.error_code,
              response.message || 'License deactivation failed'
            );
            throw new Error(errorMessage);
          }

          return response;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ 
            isDeactivating: false,
            isLoading: false 
          });
        }
      },

      /**
       * Check the current license status.
       */
      checkLicenseStatus: async (forceRefresh = false) => {
        set({ 
          isRefreshing: forceRefresh,
          isLoading: !forceRefresh, // Don't show main loading for refreshes
          error: null 
        });

        try {
          const response = await licenseApi.checkLicenseStatus(forceRefresh);
          
          // Always update state regardless of success status
          // because "no license" is a valid state
          set({
            licenseKey: response.data?.license_key || '',
            status: response.status,
            isActive: response.isActive,
            licenseData: response.data,
            lastChecked: new Date().toISOString(),
            fromCache: response.fromCache,
            error: response.success ? null : response.message
          });

          return response;
        } catch (error) {
          set({ 
            error: error.message,
            status: 'unknown'
          });
          throw error;
        } finally {
          set({ 
            isRefreshing: false,
            isLoading: false 
          });
        }
      },

      /**
       * Initialize license store by checking current status.
       */
      initializeLicense: async () => {
        const { checkLicenseStatus } = get();
        
        try {
          await checkLicenseStatus(false); // Use cache if available
        } catch (error) {
          // Silently fail initialization to avoid blocking the UI
          console.warn('Failed to initialize license store:', error);
        }
      },

      /**
       * Clear the license cache.
       */
      clearLicenseCache: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await licenseApi.clearLicenseCache();
          
          if (response.success) {
            // After clearing cache, check status again
            await get().checkLicenseStatus(true);
          } else {
            throw new Error(response.message || 'Failed to clear cache');
          }

          return response;
        } catch (error) {
          set({ error: error.message });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Get the current license status display information.
       */
      getStatusDisplay: () => {
        const { status, isActive } = get();
        return licenseApi.getStatusBadge(status, isActive);
      },

      /**
       * Check if the license needs attention (expired, invalid, etc.).
       */
      needsAttention: () => {
        const { status, isActive } = get();
        return !isActive && ['expired', 'invalid', 'inactive'].includes(status);
      },

      /**
       * Get formatted expiration information.
       */
      getExpirationInfo: () => {
        const { licenseData } = get();
        
        if (!licenseData.expires || licenseData.expires === 'lifetime') {
          return null;
        }

        const expirationDate = new Date(licenseData.expires);
        const now = new Date();
        const timeDiff = expirationDate.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        return {
          date: expirationDate,
          daysRemaining: daysDiff,
          isExpired: daysDiff < 0,
          isExpiringSoon: daysDiff <= 30 && daysDiff > 0
        };
      },



      /**
       * Get the manage license URL securely from the backend.
       * This avoids exposing the license key in the frontend.
       */
      getManageLicenseUrl: async () => {
        try {
          const response = await licenseApi.getManageLicenseUrl();

          if (response.success && response.url) {
            return response.url;
          } else {
            throw new Error(response.message || 'Failed to get manage license URL');
          }
        } catch (error) {
          console.error('Failed to get manage license URL:', error);
          throw error;
        }
      },

      /**
       * Reset the store to initial state.
       */
      reset: () => {
        set({
          licenseKey: '',
          status: 'unknown',
          isActive: false,
          isLoading: false,
          error: null,
          lastChecked: null,
          fromCache: false,
          licenseData: {},
          isActivating: false,
          isDeactivating: false,
          isRefreshing: false,
          isUpgrading: false,
          upgradeAvailable: false,
          downloadUrl: '',
          upgradeProgress: null
        });
      }
    }),
    {
      name: 'wpchat-license-store',
      // Only include important state in devtools
      serialize: {
        options: {
          map: {
            licenseKey: (value) => value ? `${value.slice(0, 4)}****${value.slice(-4)}` : '',
          }
        }
      }
    }
  )
);

export default useLicenseStore;