import { __ } from '@wordpress/i18n';
import { Focusable, TooltipTrigger } from 'react-aria-components';
import { CardRadioGroup, CardRadio } from '@AC/ui/CardRadioGroup';
import { Tooltip } from '@AC/ui/Tooltip';

export default function IconTypeSelect({
  value,
  onChange,
  isPlatformDisabled = false,
  disabledTooltipText,
}) {
  const platformCard = (
    <CardRadio
      value="platform"
      title={__('Platform Icons', 'smashballoon-wpchat-livechat-customer-support')}
      description={__('Show platform icons as a trigger to open widgets', 'smashballoon-wpchat-livechat-customer-support')}
      isDisabled={isPlatformDisabled}
    />
  );

  return (
    <CardRadioGroup value={value} onChange={onChange}>
      {isPlatformDisabled ? (
        <TooltipTrigger delay={0}>
          <Focusable>
            <div>{platformCard}</div>
          </Focusable>
          <Tooltip placement="top">{disabledTooltipText}</Tooltip>
        </TooltipTrigger>
      ) : (
        platformCard
      )}
      <CardRadio
        value="custom"
        title={__('Custom Icon', 'smashballoon-wpchat-livechat-customer-support')}
        description={__('Display a single custom icon at bottom right', 'smashballoon-wpchat-livechat-customer-support')}
      />
    </CardRadioGroup>
  );
}
