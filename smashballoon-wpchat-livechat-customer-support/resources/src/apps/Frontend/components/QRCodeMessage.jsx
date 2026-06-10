import { __, sprintf } from '@wordpress/i18n';
import { QRCode } from 'react-qrcode-logo';
import logoMono from '@Assets/svg/logo-mono.svg?url';

export default function QRCodeMessage({ platformName, link, platform }) {
  const action = platform === 'phone' ? __('call', 'smashballoon-wpchat-livechat-customer-support') : __('SMS', 'smashballoon-wpchat-livechat-customer-support');

  const message = sprintf(
    /* translators: 1: platform name (e.g., "SMS", "Phone"), 2: action (e.g., "SMS", "call") */
    __('Cannot do %1$s on desktop. Please scan the QR code to %2$s from your phone.', 'smashballoon-wpchat-livechat-customer-support'),
    platformName,
    action,
  );

  return (
    <div>
      <p className='wpchat:mb-3'>{message}</p>
      <div className='wpchat:flex wpchat:justify-center wpchat:rounded-3xl wpchat:px-6.5 wpchat:py-5.5 wpchat:bg-white'>
        <QRCode
          value={link}
          size={1024}
          ecLevel="H"
          quietZone={8}
          qrStyle='dots'
          eyeRadius={8}
          logoImage={logoMono}
          logoWidth={300}
          logoHeight={230}
          logoPadding={20}
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
    </div>
  );
}
