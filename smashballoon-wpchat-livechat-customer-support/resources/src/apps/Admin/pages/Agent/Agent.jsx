import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { __, sprintf } from '@wordpress/i18n';
import AgentSingleItem from '@AC/Agent/AgentSingleItem';
import PlatformCoverageWarning from '@AC/Agent/PlatformCoverageWarning';
import PageLayout from '@AC/PageLayout';
import UpgradeToPro from '@AC/UpgradeToPro';
import UpgradeToProDialog from '@AC/UpgradeToProDialog';
import { Button } from '@AC/ui/Button';
import { Dialog } from '@AC/ui/Dialog';
import { Modal } from '@AC/ui/Modal';
import { HideOnMobile } from '@Components/HideComponent';
import SvgLoader from '@Components/SvgLoader';
import useAgentsStore from '@DataStore/agents/agentsStore';
import useSettingsStore from '@DataStore/settings/settingsStore';
import { useEntitlements } from '@AH/useEntitlements';
import { getUpgradeDialogData, upgradeConfigs } from '@AU/upgradeDialogs';
import { isPro } from '@Utils/isPro';
import AgentSkeleton from '@AC/Agent/AgentSkeleton';

const NewAgentInfo = isPro ? lazy(() => import('@ACPro/Agent/NewAgentInfo')) : null;

    const UpgradeToProData = {
      title: __(
        'Upgrade to add unlimited agents',
        'smashballoon-wpchat-livechat-customer-support',
      ),
      description: __(
        'Get detailed analytics and much more when you upgrade',
        'smashballoon-wpchat-livechat-customer-support',
      ),
      features: [
        {
          icon: <SvgLoader name='supportAgent' className="wpchat:fill-green-600" />,
          title: __('Add unlimited agents', 'smashballoon-wpchat-livechat-customer-support'),
          description: __(
            'Add an unlimited number of agents to scale your support team',
            'smashballoon-wpchat-livechat-customer-support',
          ),
        },
        {
          icon: <SvgLoader name='chronic' className="wpchat:fill-green-600"/>,
          title: __('Add agent times', 'smashballoon-wpchat-livechat-customer-support'),
          description: __(
            'Fine tune agent timings and we smartly route requests to agents that are available ',
            'smashballoon-wpchat-livechat-customer-support',
          ),
        },
      ],
    };

/**
 * Agents component displays a list or interface related to AI agents or team members.
 * Could be used to manage, showcase, or interact with various agents in the application.
 *
 * @component
 * @returns {JSX.Element} The rendered Agents component.
 */
export default function Agents() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const { agents, loadAgents, removeAgent, loading, error } = useAgentsStore();
  const { settings, fetchSettings } = useSettingsStore();
  const { agentLimits, isPro: isProPlan } = useEntitlements();

  // Get the appropriate upgrade dialog data
  const upgradeDialogData = getUpgradeDialogData('agents', {
    isPro: isProPlan,
    currentCount: agentLimits.current,
    maxLimit: agentLimits.max,
    ...upgradeConfigs.agents,
  });

  useEffect(() => {
    loadAgents();
    isPro && fetchSettings();
  }, [loadAgents, fetchSettings]);

  if (loading) {
    return <AgentSkeleton />;
  }

  function deleteAgent(agentId) {
    if (!isPro) return;
    removeAgent(agentId);
  }

  function HeaderButtons() {
    return (
      <div className='wpchat:flex wpchat:gap-2'>
        <Button
          onPress={() => {
            if (!agentLimits.canCreateMore) {
              setIsOpen(true);
            } else {
              navigate('/agents/create');
            }
          }}
        >
          <SvgLoader name='plus' />
          <HideOnMobile>{__('New Agent', 'smashballoon-wpchat-livechat-customer-support')}</HideOnMobile>
        </Button>
        <Button variant='secondary' onPress={() => navigate('/agents/settings')}>
          <SvgLoader name='cog' />
          <HideOnMobile>{__('Agent Settings', 'smashballoon-wpchat-livechat-customer-support')}</HideOnMobile>
        </Button>
      </div>
    );
  }

  return (
    <PageLayout breadcrumb={[{ label: __('Agents', 'smashballoon-wpchat-livechat-customer-support') }]} HeaderButtons={HeaderButtons}>
      <PlatformCoverageWarning enabledPlatforms={settings?.agentSettings?.platforms || {}} />
      {(isPro ? agents : agents.slice(0, 1)).map((agent, index) => (
        <AgentSingleItem
          key={agent.id}
          className='wpchat:mb-4'
          onClick={() => navigate(`/agents/edit/${agent.id}`)}
          avatarClassName='wpchat:w-6 wpchat:h-6'
          agent={agent}
          isLastAgent={isPro && agents.length === 1}
          onDelete={isPro ? () => deleteAgent(agent.id) : null}
          settings={settings}
        />
      ))}
      {!isPro && <UpgradeToPro {...UpgradeToProData} />}
      <Suspense>{isPro && <NewAgentInfo />}</Suspense>
      <Modal isOpen={isOpen} onOpenChange={setIsOpen} isDismissable>
        <Dialog>
          <UpgradeToProDialog {...upgradeDialogData} />
        </Dialog>
      </Modal>
    </PageLayout>
  );
}
