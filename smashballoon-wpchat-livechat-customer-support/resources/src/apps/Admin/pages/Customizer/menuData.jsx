import { __ } from '@wordpress/i18n';
import ColorPalettePanel from '@AP/Customizer/Panels/ColorPalettePanel';
import FAQPanel from '@AP/Customizer/Panels/FAQPanel';
import HeaderPanel from '@AP/Customizer/Panels/HeaderPanel';
import IconPanel from '@AP/Customizer/Panels/IconPanel';
import AssistantAvatarPanel from '@AP/Customizer/Panels/AssistantAvatarPanel';
import SendMessagePanel from '@AP/Customizer/Panels/SendMessagePanel';
import ThemePanel from '@AP/Customizer/Panels/ThemePanel';

export const menuData = [
  {
    slug: 'theme',
    title: 'Theme',
    type: 'section',
    icon: 'theme',
    component: <ThemePanel />,
    sortable: false,
  },
  {
    slug: 'colorPalette',
    title: 'Color Palette',
    type: 'section',
    icon: 'colorPalette',
    component: <ColorPalettePanel />,
    sortable: false,
    upsellLevel: 'content',
    requiredEntitlement: 'hasFullCustomizerEntitlement',
  },
  {
    slug: 'header',
    title: 'Header',
    type: 'section',
    icon: 'header',
    component: <HeaderPanel />,
    sortable: false,
  },
  {
    slug: 'icon',
    title: 'Icon',
    type: 'section',
    icon: 'messageIcon',
    component: <IconPanel />,
    sortable: false,
  },
  {
    slug: 'assistantAvatar',
    title: 'Assistant Avatar',
    type: 'section',
    icon: 'bot',
    component: <AssistantAvatarPanel />,
    sortable: false,
  },
  {
    type: 'headingSection',
    slug: 'reorder-title-section',
    title: 'Sections',
    borderBottom: true,
  },
  {
    slug: 'sendMessage',
    title: 'Send Message',
    type: 'section',
    sortable: true,
    component: <SendMessagePanel />,
  },
  {
    slug: 'frequentQuestions',
    title: 'Frequent Questions',
    type: 'section',
    sortable: true,
    component: <FAQPanel />,
    visibilityRequires: 'faqs',
    visibilityDisabledMessage: __('This section is hidden. Add some FAQs to start displaying it.', 'smashballoon-wpchat-livechat-customer-support'),
    visibilityDisabledTooltip: __('This section can be enabled once you add your first question.', 'smashballoon-wpchat-livechat-customer-support'),
  },
  {
    slug: 'wpChatBranding',
    title: 'WPChat Branding',
    type: 'section',
    sortable: true,
    draggable: false,
    upsellLevel: 'menu',
    requiredEntitlement: 'hasWhiteLabelEntitlement',
  }
];
