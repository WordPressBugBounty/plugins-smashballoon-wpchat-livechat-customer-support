import React from 'react';
import { __ } from '@wordpress/i18n';

const PeriodInfo = ({ period, timezoneInfo }) => {
  return (
    <div className="wpchat:text-xs wpchat:text-gray-500 wpchat:text-end">
      {period?.start && period?.end && (
        <span className="wpchat:me-3">
          {__('Period', 'smashballoon-wpchat-livechat-customer-support')}: {period.start} – {period.end}
        </span>
      )}
      {timezoneInfo?.timezone_string && (
        <span>
          {__('Timezone', 'smashballoon-wpchat-livechat-customer-support')}: {timezoneInfo.timezone_abbr || timezoneInfo.timezone_string}
        </span>
      )}
    </div>
  );
};

export default PeriodInfo; 