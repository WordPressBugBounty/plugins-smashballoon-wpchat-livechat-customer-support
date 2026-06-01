import React, { useEffect, useState } from 'react';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { useLocation, useNavigate, useParams } from 'react-router';
import { __ } from '@wordpress/i18n';
import AgentCreateEdit from '@AC/Agent/AgentCreateEdit';
import { Button } from '@AC/ui/Button';
import { Toast } from '@AC/ui/Toast';
import { useBodyBackground } from '@AH/useBodyBackground';
import { HideOnDesktop, HideOnMobile } from '@Components/HideComponent';
import useAgentsStore from '@DataStore/agents/agentsStore';
import useSettingsStore from '@DataStore/settings/settingsStore';
import { isValidTelegram, isValidMessenger, isValidInstagram } from '@Utils/validation';

/**
 * AgentSingle component handles both creating and editing agents.
 * Dynamically adjusts based on the URL path (agents/create or agents/edit).
 *
 * @component
 * @returns {JSX.Element} The rendered AgentSingle component.
 */
export default function AgentSingle() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addAgent, editAgent } = useAgentsStore();
  const { settings } = useSettingsStore();
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: '' });
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = location.pathname.includes('/edit/');

  useBodyBackground('#fff');

  useEffect(() => {
    // Check if we came from a successful create operation
    if (location.state?.showSuccessMessage) {
      setToast({
        show: true,
        message: location.state.successMessage || __('Agent saved successfully', 'smashballoon-wpchat-livechat-customer-support'),
      });
    }
  }, [location.state]);

  /**
   * Helper function to validate platform fields
   * @param {string} platformKey - The platform key in enabledPlatforms and agentData.platforms
   * @param {object} enabledPlatforms - Object containing enabled platform flags
   * @param {string} platformValue - The value to validate
   * @param {function} validatorFn - Validation function to check the value
   * @param {string} errorMessage - Error message to return if validation fails
   * @param {boolean} isRequired - Whether the field is required (default: false)
   * @returns {string|null} - Error message if validation fails, null otherwise
   */
  const validatePlatform = (platformKey, enabledPlatforms, platformValue, validatorFn, errorMessage, isRequired = false) => {
    // Skip validation if platform is not enabled (handle new format: { enabled: boolean, value: string })
    if (!enabledPlatforms[platformKey]?.enabled) {
      return null;
    }

    // For required fields, check if value exists
    if (isRequired && !platformValue) {
      return errorMessage;
    }

    // For optional fields, only validate if value is provided
    if (!isRequired && !platformValue) {
      return null;
    }

    // Run the validation function (validators internally strip @ if needed)
    if (!validatorFn(platformValue)) {
      return errorMessage;
    }

    return null;
  };

  const handleSave = async (agentData) => {
    const validationErrors = {};
    setIsSaving(true);

    // Get enabled platforms from settings
    const enabledPlatforms = settings?.agentSettings?.platforms || {};

    if (!agentData.name || agentData.name.trim() === '') {
      validationErrors.name = __(
        'Agent name is required.',
        'smashballoon-wpchat-livechat-customer-support',
      );
    }

    // Platform validation configuration
    const platformValidations = [
      {
        key: 'whatsapp',
        value: agentData.platforms.whatsapp,
        validator: isValidPhoneNumber,
        errorMessage: __('Please enter a valid WhatsApp phone number with country code (e.g., +1234567890).', 'smashballoon-wpchat-livechat-customer-support'),
        required: false,
      },
      {
        key: 'telegram',
        value: agentData.platforms.telegram,
        validator: isValidTelegram,
        errorMessage: __('Please enter a valid Telegram username (5-32 characters) or phone number with country code (e.g., +1234567890).', 'smashballoon-wpchat-livechat-customer-support'),
        required: false,
      },
      {
        key: 'messenger',
        value: agentData.platforms.messenger,
        validator: isValidMessenger,
        errorMessage: __('Please enter a valid Messenger username or numeric ID (10-20 digits).', 'smashballoon-wpchat-livechat-customer-support'),
        required: false,
      },
      {
        key: 'instagram',
        value: agentData.platforms.instagram,
        validator: isValidInstagram,
        errorMessage: __('Please enter a valid Instagram username (1-30 characters, letters, numbers, periods, and underscores only).', 'smashballoon-wpchat-livechat-customer-support'),
        required: false,
      },
      {
        key: 'phone',
        value: agentData.platforms.phone,
        validator: isValidPhoneNumber,
        errorMessage: __('Please enter a valid phone number with country code (e.g., +1234567890).', 'smashballoon-wpchat-livechat-customer-support'),
        required: false,
      },
      {
        key: 'message',
        value: agentData.platforms.message,
        validator: isValidPhoneNumber,
        errorMessage: __('Please enter a valid phone number with country code for iMessage (e.g., +1234567890).', 'smashballoon-wpchat-livechat-customer-support'),
        required: false,
      },
    ];

    // Run validation for all platforms
    platformValidations.forEach(({ key, value, validator, errorMessage, required }) => {
      const error = validatePlatform(key, enabledPlatforms, value, validator, errorMessage, required);
      if (error) {
        validationErrors[key] = error;
      }
    });

    // Check if at least one enabled platform has a valid value
    const hasAtLeastOnePlatform = platformValidations.some(({ key, value, validator }) => {
      const platform = enabledPlatforms[key];
      // Platform must be enabled in settings
      if (!platform?.enabled) return false;
      // Platform must have a value
      if (!value || !value.trim()) return false;

      // Platform value must be valid (validators internally strip @ if needed)
      return validator(value);
    });

    if (!hasAtLeastOnePlatform) {
      validationErrors.platforms = __(
        'Please add at least one valid platform contact method.',
        'smashballoon-wpchat-livechat-customer-support',
      );
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSaving(false);
      return;
    }

    setErrors({});
    try {
      if (isEdit) {
        await editAgent(slug, agentData);
        setToast({
          show: true,
          message: __('Agent updated successfully', 'smashballoon-wpchat-livechat-customer-support'),
        });
      } else {
        const createdAgentId = await addAgent(agentData);
        if (createdAgentId) {
          // Transition to edit mode by navigating to the edit URL
          navigate(`/agents/edit/${createdAgentId}`, {
            replace: true,
            state: {
              showSuccessMessage: true,
              successMessage: __('Agent saved successfully', 'smashballoon-wpchat-livechat-customer-support')
            }
          });
        }
      }
    } catch (error) {
      console.error('Error saving agent data:', error);
      setToast({
        show: true,
        message: __('[WPC-AGT-007] Error saving agent data', 'smashballoon-wpchat-livechat-customer-support') + `: ${error}`,
        type: 'error'
      });
    } finally {
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    }
  };

  const HeaderButtons = ({ agentData }) => (
    <div className='wpchat:flex wpchat:gap-2'>
      <Button
        onPress={() => handleSave(agentData)}
        variant='primary'
        isPending={isSaving}
        isLoading={true === isSaving}
      >
        <HideOnMobile>{__('Save Changes', 'smashballoon-wpchat-livechat-customer-support')}</HideOnMobile>
        <HideOnDesktop>{__('Save', 'smashballoon-wpchat-livechat-customer-support')}</HideOnDesktop>
      </Button>
      <Button variant='secondary' onPress={() => navigate('/agents')}>
        {__('Cancel', 'smashballoon-wpchat-livechat-customer-support')}
      </Button>
    </div>
  );

  return (
    <>
      <AgentCreateEdit
        slug={isEdit ? slug : undefined} // Pass slug only for edit mode.
        breadcrumb={[
          { label: __('Agents', 'smashballoon-wpchat-livechat-customer-support'), href: '/agents' },
          {
            label: isEdit
              ? __('Edit', 'smashballoon-wpchat-livechat-customer-support')
              : __('Create', 'smashballoon-wpchat-livechat-customer-support'),
          },
        ]}
        HeaderButtons={(props) => <HeaderButtons {...props} />}
        errors={errors}
        setErrors={setErrors}
      />
      <Toast
        show={toast.show}
        message={toast.message}
        onClose={() => setToast({ show: false, message: '' })}
      />
    </>
  );
}
