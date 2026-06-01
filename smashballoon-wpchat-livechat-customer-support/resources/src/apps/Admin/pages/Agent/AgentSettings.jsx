import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { Tab, TabList, Tabs } from 'react-aria-components';
import { twMerge } from 'tailwind-merge';
import { __ } from '@wordpress/i18n';
import Alert from '@AC/Alert';
import PageLayout from '@AC/PageLayout';
import Separator from '@AC/Separator';
import { Button } from '@AC/ui/Button';
import { Select, SelectItem } from '@AC/ui/Select';
import { Switch } from '@AC/ui/Switch';
import { Toast } from '@AC/ui/Toast';
import { useBodyBackground } from '@AH/useBodyBackground';
import { HideOnDesktop, HideOnMobile } from '@Components/HideComponent';
import SvgLoader from '@Components/SvgLoader';
import TitleDescription from '@Components/TitleDescription';
import useAgentsStore from '@DataStore/agents/agentsStore';
import useSettingsStore from '@DataStore/settings/settingsStore';
import { freePlatforms } from '@Utils/getPlatforms';
import { isPro } from '@Utils/isPro';

export default function AgentSettings() {
  const [options, setOptions] = useState(false);
  const [messagingApps, setMessagingApps] = useState(freePlatforms);
  const [enabledPlatforms, setEnabledPlatforms] = useState({});
  const [offHoursRule, setOffHoursRule] = useState('disable');
  const [selectedOffHoursAgent, setSelectedOffHoursAgent] = useState('');
  const { settings, fetchSettings, saveSettings } = useSettingsStore();
  const { agents, loadAgents } = useAgentsStore();
  const [alert, setAlert] = useState({ show: false, variant: 'info', icon: '', title: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  useBodyBackground('#fff');

  useEffect(() => {
    fetchSettings();
    loadAgents();
  }, [fetchSettings, loadAgents]);

  useEffect(() => {
    if (settings?.agentSettings) {
      setOptions(settings.agentSettings.timings);
      setEnabledPlatforms(settings.agentSettings.platforms);
      setOffHoursRule(settings.agentSettings.offHoursRule || 'disable');
      setSelectedOffHoursAgent(settings.agentSettings.selectedOffHoursAgent || '');
      setHasChanges(false);
    }
  }, [settings]);

  const handleTimingChange = (value) => {
    setOptions(value);
    setHasChanges(true);
  };

  const togglePlatform = (slug) => {
    setEnabledPlatforms((prev) => {
      const currentPlatform = prev[slug];
      // Handle new format: { enabled: boolean, value: string }
      const isCurrentlyEnabled = currentPlatform?.enabled || false;

      return {
        ...prev,
        [slug]: {
          enabled: !isCurrentlyEnabled,
          value: currentPlatform?.value || ''
        }
      };
    });
    setHasChanges(true);
  };

  const handleOffHoursRuleChange = (value) => {
    setOffHoursRule(value);
    setHasChanges(true);
  };

  const offHoursOptions = [
    {
      id: 'disable',
      title: __('Disable contact option', 'smashballoon-wpchat-livechat-customer-support'),
      description: __(
        'Disable all contact methods when agents are offline. Customers will see business hours.',
        'smashballoon-wpchat-livechat-customer-support',
      ),
    },
    {
      id: 'redirect',
      title: __('Redirect to an off-hours agent', 'smashballoon-wpchat-livechat-customer-support'),
      description: __(
        'Redirect to an agent of your choice',
        'smashballoon-wpchat-livechat-customer-support',
      ),
    },
  ];

  const handleOffHoursAgentChange = (value) => {
    setSelectedOffHoursAgent(value);
    setHasChanges(true);
  };

  const handleSaveSettings = () => {
    // Validate that at least one platform is enabled (handle new format: { enabled: boolean, value: string })
    const enabledCount = Object.values(enabledPlatforms).filter(
      platform => platform?.enabled === true
    ).length;

    if (enabledCount === 0) {
      setAlert({
        show: true,
        variant: 'error',
        icon: 'warning',
        description: __('At least one platform must be active before saving.', 'smashballoon-wpchat-livechat-customer-support'),
      });
      return;
    }

    setIsSaving(true);
    setAlert({ show: false, variant: 'info', icon: '', title: '', description: '' });

    saveSettings({
      ...settings,
      agentSettings: {
        timings: options,
        platforms: enabledPlatforms,
        offHoursRule: offHoursRule,
        selectedOffHoursAgent: selectedOffHoursAgent,
      },
    });

    setTimeout(() => {
      setIsSaving(false);
      setToast({
        show: true,
        message: __('Settings saved successfully', 'smashballoon-wpchat-livechat-customer-support'),
      });
      setHasChanges(false);
    }, 500);
  };

  function HeaderButtons() {
    return (
      <div className='wpchat:flex wpchat:gap-2'>
        <Button
          onPress={handleSaveSettings}
          isPending={isSaving}
          isLoading={true === isSaving}
          isDisabled={!hasChanges}
        >
          <HideOnMobile>
            {__('Save Changes', 'smashballoon-wpchat-livechat-customer-support')}
          </HideOnMobile>
          <HideOnDesktop>{__('Save', 'smashballoon-wpchat-livechat-customer-support')}</HideOnDesktop>
        </Button>
      </div>
    );
  }

  return (
    <PageLayout
      breadcrumb={[
        { label: __('Agents', 'smashballoon-wpchat-livechat-customer-support'), href: '/agents' },
        { label: __('Settings', 'smashballoon-wpchat-livechat-customer-support') },
      ]}
      HeaderButtons={HeaderButtons}
      layoutClassName='wpchat:bg-white'
    >
      {alert.show && (
        <Alert
          icon={alert.icon}
          title={alert.title}
          description={alert.description}
          variant={alert.variant}
          className='wpchat:mb-5'
        />
      )}
      {isPro && (
        <>
          <TitleDescription
            title={__('Timings', 'smashballoon-wpchat-livechat-customer-support')}
            description={__(
              'Each support agent can have their own timings. Chat Assistant will use these timings to smartly route requests.',
              'smashballoon-wpchat-livechat-customer-support',
            )}
          />
          <Select selectedKey={options} onSelectionChange={handleTimingChange}>
            <SelectItem id={true}>{__('Enable', 'smashballoon-wpchat-livechat-customer-support')}</SelectItem>
            <SelectItem id={false}>
              {__('Disable', 'smashballoon-wpchat-livechat-customer-support')}
            </SelectItem>
          </Select>
          <Separator />
          {options && (
            <>
              <TitleDescription
                title={__('Off hours rules', 'smashballoon-wpchat-livechat-customer-support')}
                description={__(
                  'In case no agents are available, these rules would be followed',
                  'smashballoon-wpchat-livechat-customer-support',
                )}
              />
              <Tabs selectedKey={offHoursRule} onSelectionChange={handleOffHoursRuleChange}>
                <TabList
                  aria-label='Off hours rules'
                  className='wpchat:grid wpchat:grid-cols-1 wpchat:gap-2.5'
                >
                  {offHoursOptions.map(({ id, title, description }) => (
                    <Tab
                      key={id}
                      id={id}
                      className={twMerge(
                        clsx(
                          'wpchat:relative wpchat:cursor-pointer wpchat:rounded-lg wpchat:border wpchat:border-gray-200 wpchat:bg-white wpchat:py-5 wpchat:pe-5 wpchat:ps-13 wpchat:shadow-sm',
                          {
                            'wpchat:border-wp-light-blue-500': id === offHoursRule,
                          },
                        ),
                      )}
                    >
                      <span
                        className={twMerge(
                          clsx(
                            'wpchat:absolute wpchat:top-6 wpchat:start-5 wpchat:h-4 wpchat:w-4 wpchat:rounded-full wpchat:border wpchat:border-gray-500',
                            {
                              'wpchat:border-wp-light-blue-500 wpchat:border-5': id === offHoursRule,
                            },
                          ),
                        )}
                      ></span>
                      <div className='wpchat:flex wpchat:flex-col wpchat:gap-1'>
                        <h6 className='wpchat:mt-0 wpchat:mb-1 wpchat:text-sm wpchat:leading-relaxed wpchat:font-semibold wpchat:text-gray-800'>
                          {title}
                        </h6>
                        <p className='wpchat:m-0 wpchat:text-xs wpchat:leading-relaxed wpchat:text-gray-500'>
                          {description}
                        </p>
                        {id === 'redirect' && offHoursRule === 'redirect' && (
                          <div className='wpchat:mt-3'>
                            <Select
                              selectedKey={selectedOffHoursAgent}
                              onSelectionChange={handleOffHoursAgentChange}
                              placeholder={__('Select Agent', 'smashballoon-wpchat-livechat-customer-support')}
                              className='wpchat:max-w-xs'
                            >
                              {agents.map((agent) => (
                                <SelectItem key={agent.id} id={agent.id.toString()}>
                                  {agent.name}
                                </SelectItem>
                              ))}
                            </Select>
                          </div>
                        )}
                      </div>
                    </Tab>
                  ))}
                </TabList>
              </Tabs>
              <Separator />
            </>
          )}
        </>
      )}
      <TitleDescription
        title={__('Platforms', 'smashballoon-wpchat-livechat-customer-support')}
        description={__(
          'Your customers will be provided option to get in touch with on the following platforms',
          'smashballoon-wpchat-livechat-customer-support',
        )}
      />
      <Separator className='wpchat:mt-5 wpchat:mb-4' />
      {messagingApps.map((app, index) => (
        <div key={app.slug}>
          <Switch
            className='wpchat:flex wpchat:justify-between'
            isSelected={enabledPlatforms?.[app.slug]?.enabled || false}
            onChange={() => togglePlatform(app.slug)}
          >
            <span className='wpchat:flex wpchat:justify-between'>
              <SvgLoader name={app.slug + 'Color'} />
              <p className='wpchat:my-0 wpchat:ms-3 wpchat:text-base wpchat:text-gray-900'>
                {app.label}
              </p>
            </span>
          </Switch>
          {index !== messagingApps.length - 1 && <Separator className='wpchat:mt-4 wpchat:mb-4' />}
        </div>
      ))}
      <Toast
        show={toast.show}
        message={toast.message}
        onClose={() => setToast({ show: false, message: '' })}
      />
    </PageLayout>
  );
}
