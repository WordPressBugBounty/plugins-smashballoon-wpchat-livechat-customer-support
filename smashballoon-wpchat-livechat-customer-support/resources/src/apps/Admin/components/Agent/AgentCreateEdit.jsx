import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { __ } from '@wordpress/i18n';
import Alert from '@AC/Alert';
import Avatar from '@Components/Avatar';
import ImageUpload from '@AC/ImageUpload';
import PageLayout from '@AC/PageLayout';
import Separator from '@AC/Separator';
import TitleDescription from '@Components/TitleDescription';
import { TextField } from '@AC/ui/TextField';
import SvgLoader from '@Components/SvgLoader';
import useAgentsStore from '@DataStore/agents/agentsStore';
import useSettingsStore from '@DataStore/settings/settingsStore';
import { getAvatarFallback } from '@Utils/getAvatarFallback';
import { freePlatforms } from '@Utils/getPlatforms';
import { isPro } from '@Utils/isPro';
import UpgradeToPro from '@AC/UpgradeToPro';
import PlatformFieldRow from './PlatformFieldRow';
import { getPlatformConfig } from '@AConfig/platformConfig';
import { useFieldValidation } from '@AH/useFieldValidation';

const AgentCreateEditPro = isPro ? lazy(() => import('@ACPro/Agent/AgentCreateEditPro')) : null;

/**
 * Component for creating or editing an agent.
 *
 * @param {Object} props - Component props.
 * @param {string} props.slug - Unique identifier for the agent, used for data fetching or routing.
 * @param {React.ReactNode} props.breadcrumb - Breadcrumb navigation element or label.
 * @param {React.ComponentType | null} props.HeaderButtons - Optional component to render action buttons in the header.
 *
 * @returns {JSX.Element} The rendered AgentCreateEdit component.
 */
export default function AgentCreateEdit({
  slug,
  breadcrumb,
  HeaderButtons,
  errors = {},
  setErrors,
}) {

    const UpgradeToProData = {
      title: __(
        'Upgrade to add agent availability timings ',
        'smashballoon-wpchat-livechat-customer-support',
      ),
      description: __(
        'Add specific days when your agents are available and WPChat handles the routing to the available agent',
        'smashballoon-wpchat-livechat-customer-support',
      ),
      features: [
        {
          icon: <SvgLoader name='pageLevelTargeting' className="wpchat:fill-green-600" />,
          title: __('Add multiple agents', 'smashballoon-wpchat-livechat-customer-support'),
          description: __(
            'Divide your support request into multiple team members with unlimited agents',
            'smashballoon-wpchat-livechat-customer-support',
          ),
        },
        {
          icon: <SvgLoader name='categoryTagFilters' className="wpchat:fill-green-600"/>,
          title: __('Add agent schedules', 'smashballoon-wpchat-livechat-customer-support'),
          description: __(
            'Add days and hour availability for each agent to only send them request when available',
            'smashballoon-wpchat-livechat-customer-support',
          ),
        },
        {
          icon: <SvgLoader name='categorySearch' className="wpchat:fill-green-600"/>,
          title: __('Add off hour rules', 'smashballoon-wpchat-livechat-customer-support'),
          description: __(
            'Add smart rules for requests when no agents are available',
            'smashballoon-wpchat-livechat-customer-support',
          ),
        },
      ],
    };

  const [file, setFile] = useState(null);
  const { loadAgent } = useAgentsStore();
  const { settings, fetchSettings } = useSettingsStore();
  const [localAgentData, setLocalAgentData] = useState(null);

  useEffect(() => {
    fetchSettings();
    if (slug) {
      const agentId = parseInt(slug);
      loadAgent(agentId).then((agent) => {
        setLocalAgentData(agent);
      });
    } else {
      setLocalAgentData({});
    }
  }, [slug, loadAgent, fetchSettings]);

  const [currentAgentName, setCurrentAgentName] = useState('');
  const [platformValues, setPlatformValues] = useState({ whatsapp: '' });
  const [timingsValue, setTimingsValue] = useState({ startTime: '', endTime: '', weeks: '' });
  const [messagingApps, setMessagingApps] = useState(freePlatforms);

  // Use the field validation hook
  const {
    handleFieldChange,
    handleFieldBlur,
    getFieldValidationState,
  } = useFieldValidation({
    initialValues: platformValues,
    validationDelay: 1000,
  });

  useEffect(() => {
    if (localAgentData) {
      setCurrentAgentName(localAgentData.name || '');
      setFile(localAgentData?.avatar || null);
      setPlatformValues(
        localAgentData.platforms || {
          whatsapp: localAgentData.platforms?.whatsapp || '',
        },
      );
      setTimingsValue({
        startTime: localAgentData.schedule?.start_time || '',
        endTime: localAgentData.schedule?.end_time || '',
        weeks: localAgentData.schedule?.days_of_week || '',
      });
    }
  }, [localAgentData]);

  useEffect(() => {
    if (isPro) {
      import('@UtilsPro/getProPlatforms').then((mod) => {
        setMessagingApps(mod.proPlatforms);
      });
    }
  }, []);

  // Filter messaging apps based on enabled platforms in agent settings
  const enabledPlatforms = settings?.agentSettings?.platforms || {};
  const filteredMessagingApps = useMemo(() => {
    // If no platform settings exist yet, show all platforms
    const hasPlatformSettings = Object.keys(enabledPlatforms).length > 0;
    if (!hasPlatformSettings) {
      return messagingApps;
    }

    // Filter to only show enabled platforms with new format: { enabled: boolean, value: string }
    return messagingApps.filter(app => {
      const platform = enabledPlatforms[app.slug];
      return platform?.enabled === true;
    });
  }, [messagingApps, enabledPlatforms]);

  const avatarFallback = getAvatarFallback(currentAgentName);

  const handlePlatformChange = useCallback(
    (slug) => (value) => {
      setPlatformValues((prev) => ({
        ...prev,
        [slug]: value,
      }));

      // Clear the general platforms error when user starts typing
      setErrors((prevErrors) => {
        if (prevErrors.platforms) {
          const { platforms, ...rest } = prevErrors;
          return rest;
        }
        return prevErrors;
      });

      // Trigger validation
      handleFieldChange(slug, value);
    },
    [setErrors, handleFieldChange],
  );

  const agentData = useMemo(() => {
    return {
      id: localAgentData?.id,
      name: currentAgentName,
      platforms: platformValues,
      schedule: {
        start_time: timingsValue.startTime,
        end_time: timingsValue.endTime,
        days_of_week: timingsValue.weeks,
      },
      avatar: file || '',
    };
  }, [localAgentData, currentAgentName, platformValues, timingsValue, file]);

  return (
    <PageLayout
      breadcrumb={breadcrumb && breadcrumb}
      HeaderButtons={HeaderButtons ? (props) => <HeaderButtons agentData={agentData} /> : null}
      layoutClassName='wpchat:bg-white'
      disableHelpBtn={true}
    >
      <div className='wpchat:relative wpchat:ps-22'>
        <div className='wpchat:absolute wpchat:top-0 wpchat:start-3'>
          <Avatar file={file} fallback={avatarFallback} />
        </div>
        <TitleDescription
          title={__('Profile Picture', 'smashballoon-wpchat-livechat-customer-support')}
          description={__(
            'Upload a square image that represents your agent. This will be displayed to customers during chat conversations.',
            'smashballoon-wpchat-livechat-customer-support',
          )}
        />
        <ImageUpload onFileSelect={setFile} onReset={file ? () => setFile(null) : undefined}/>
      </div>
      <Separator className='wpchat:mt-8' />
      <TextField
        label={__('Agent Name', 'smashballoon-wpchat-livechat-customer-support')}
        name='agent-name'
        type='text'
        onChange={(value) => {
          setCurrentAgentName(value);
          if (errors.name) {
            setErrors((prevErrors) => ({ ...prevErrors, name: '' }));
          }
        }}
        value={currentAgentName}
        inputClassName='wpchat:w-full'
        isRequired
        errorMessage={errors.name}
        isInvalid={!!errors.name}
      />
      <Separator className='wpchat:mt-8' />
      {AgentCreateEditPro && settings?.agentSettings?.timings && (
        <Suspense>
          <AgentCreateEditPro {...timingsValue} setTimingsValue={setTimingsValue} />
        </Suspense>
      )}
      <TitleDescription
        title={__('Contact Details', 'smashballoon-wpchat-livechat-customer-support')}
        description={__('These are platforms customers will get in touch with', 'smashballoon-wpchat-livechat-customer-support')}
      ></TitleDescription>
      {errors.platforms && (
        <Alert
          variant='error'
          icon='warning'
          description={errors.platforms}
          className='wpchat:mt-4'
        />
      )}
      <Separator className='wpchat:mt-5 wpchat:mb-0' />
      {filteredMessagingApps.map((app, index) => {
        const platformConfig = getPlatformConfig(app.slug);
        // Skip rendering if platform config is not found
        if (!platformConfig) {
          return null;
        }

        const platformValue = platformValues[app.slug] || '';
        const validationState = getFieldValidationState(
          app.slug,
          platformValue,
          app.slug === 'whatsapp' ? 'phone' : 'username'
        );

        return (
          <div key={app.slug}>
            <PlatformFieldRow
              platform={platformConfig}
              value={platformValue}
              onChange={(value) => {
                handlePlatformChange(app.slug)(value);
              }}
              onBlur={() => handleFieldBlur(app.slug)}
              validationStatus={validationState.status}
              validationMessage={validationState.message}
              isLast={index === filteredMessagingApps.length - 1}
              borderBottom={true}
            />
          </div>
        );
      })}
      {!isPro && <UpgradeToPro {...UpgradeToProData} className="wpchat:mt-10"/>}
    </PageLayout>
  );
}
