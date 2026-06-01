import React, { useEffect, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import Alert from '@AC/Alert';
import useAgentsStore from '@DataStore/agents/agentsStore';

/**
 * Component that checks if all enabled platforms have agent coverage
 * and displays a warning if any platforms are missing agent configuration.
 *
 * @param {Object} props Component props
 * @param {Object} props.enabledPlatforms Object with platform slugs as keys and boolean values
 * @returns {JSX.Element|null} Warning alert or null if all platforms are covered
 */
export default function PlatformCoverageWarning({ enabledPlatforms }) {
  const { agents } = useAgentsStore();
  const [uncoveredPlatforms, setUncoveredPlatforms] = useState([]);

  useEffect(() => {
    if (!agents || agents.length === 0 || !enabledPlatforms) {
      return;
    }

    // Get list of enabled platform slugs (handle new format: { enabled: boolean, value: string })
    const enabledPlatformSlugs = Object.keys(enabledPlatforms).filter(
      (platform) => enabledPlatforms[platform]?.enabled === true
    );

    if (enabledPlatformSlugs.length === 0) {
      setUncoveredPlatforms([]);
      return;
    }

    // Check which platforms have agent coverage
    const platformCoverage = {};
    enabledPlatformSlugs.forEach((platform) => {
      platformCoverage[platform] = false;
    });

    // Check each agent (any status) for platform configuration
    agents.forEach((agent) => {
      if (agent.platforms) {
        Object.keys(agent.platforms).forEach((platform) => {
          if (agent.platforms[platform] && enabledPlatformSlugs.includes(platform)) {
            platformCoverage[platform] = true;
          }
        });
      }
    });

    // Find platforms without coverage
    const uncovered = Object.keys(platformCoverage).filter(
      (platform) => !platformCoverage[platform]
    );

    setUncoveredPlatforms(uncovered);
  }, [agents, enabledPlatforms]);

  if (uncoveredPlatforms.length === 0) {
    return null;
  }

  const platformLabels = {
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    messenger: 'Messenger',
    instagram: 'Instagram',
    phone: 'Phone',
    message: 'Message',
    facetime: 'FaceTime',
  };

  const uncoveredLabels = uncoveredPlatforms.map(
    (platform) => platformLabels[platform] || platform
  );

  const warningMessage = uncoveredLabels.length === 1
    ? sprintf(
        __('%s is enabled but no agents have it configured. Configure this platform for at least one agent by editing an agent below.', 'smashballoon-wpchat-livechat-customer-support'),
        uncoveredLabels[0]
      )
    : sprintf(
        __('%s are enabled but no agents have them configured. Configure these platforms for at least one agent by editing an agent below.', 'smashballoon-wpchat-livechat-customer-support'),
        uncoveredLabels.join(', ')
      );

  return (
    <Alert
      icon="warning"
      title={__('Platform Configuration Warning', 'smashballoon-wpchat-livechat-customer-support')}
      description={warningMessage}
      variant="error"
      className="wpchat:mb-4"
    />
  );
}