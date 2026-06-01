import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import ColorPresetSelect from '@AC/Customizer/ColorPresetSelect';
import Separator from '@AC/Separator';
import { ColorPicker } from '@AC/ui/ColorPicker';
import { useChatStore } from '@FDataStore/Chat/chatStore';
import { getGlobalLightnessAndChroma } from '@Utils/getGlobalLightnessAndChroma';
import { oklchToHex } from '@Utils/oklchToHex';

/**
 * ColorPalettePanel component displays a panel for selecting and managing color palettes.
 *
 * @component
 *
 * @returns {JSX.Element} The rendered ColorPalettePanel component.
 */
export default function ColorPalettePanel() {
  const brandColor = useChatStore((s) => s.brandColor);
  const setBrandColor = useChatStore((s) => s.setBrandColor);
  const [currentColor, setCurrentColor] = useState('');
  const lightnessChroma = getGlobalLightnessAndChroma();

  useEffect(() => {
    setWpChatAdminBrandColor(brandColor);

    if (lightnessChroma?.lightness && lightnessChroma?.chroma && brandColor) {
      setCurrentColor(oklchToHex(lightnessChroma.lightness, lightnessChroma.chroma, brandColor));
    }
  }, []);

  useEffect(() => {
    setWpChatAdminBrandColor(brandColor);
  }, [brandColor]);

  useEffect(() => {
    currentColor?.hue && setBrandColor(currentColor.hue);
  }, [currentColor]);

  const commonColorProps = {
    lightness: lightnessChroma.lightness,
    chroma: lightnessChroma.chroma,
  };

  const shippingOptions = [
    { name: __('Default', 'smashballoon-wpchat-livechat-customer-support'), slug: 'minimal', color: { hue: 309, ...commonColorProps } },
    {
      name: __('Mystic Bloom', 'smashballoon-wpchat-livechat-customer-support'),
      slug: 'mystic-bloom',
      color: { hue: 245, ...commonColorProps },
    },
    {
      name: __('WhatsApp', 'smashballoon-wpchat-livechat-customer-support'),
      slug: 'whatsapp',
      color: { hue: 177, ...commonColorProps },
    },
    {
      name: __('WhatsApp Dark', 'smashballoon-wpchat-livechat-customer-support'),
      slug: 'whatsapp-dark',
      color: { hue: 135, ...commonColorProps },
    },
    {
      name: __('Minimal', 'smashballoon-wpchat-livechat-customer-support'),
      slug: 'minimal',
      color: { hue: 215, ...commonColorProps },
    },
  ];

  return (
    <div className='wpchat:pt-5'>
      {currentColor && (
        <ColorPicker
          label={__('Accent', 'smashballoon-wpchat-livechat-customer-support')}
          showColorArea={false}
          showColorSlider={true}
          showColorField={false}
          className='wpchat:pt-4'
          value={currentColor}
          onChange={setCurrentColor}
          defaultValue={currentColor}
        />
      )}
      <Separator variant='fullWidth' />
      <ColorPresetSelect
        label={__('Presets', 'smashballoon-wpchat-livechat-customer-support')}
        description={__('Choose from pre-selected colors that look great', 'smashballoon-wpchat-livechat-customer-support')}
        options={shippingOptions}
        value={brandColor}
        onChange={setBrandColor}
      />
    </div>
  );
}

function setWpChatAdminBrandColor(brandColor) {
  const adminElement = document.querySelector('#wp-chat-admin');
  if (adminElement) {
    adminElement.style.setProperty('--wpchat-color-brand', brandColor);
  }
}
