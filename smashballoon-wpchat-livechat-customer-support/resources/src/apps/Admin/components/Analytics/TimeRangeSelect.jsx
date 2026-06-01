import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { Select, SelectItem } from '@AC/ui/Select';
import SvgLoader from '@Components/SvgLoader';

/**
 * TimeRangeSelect component for selecting predefined time ranges
 * Uses React Aria Select component with calendar icon and formatted date ranges
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.value - Currently selected time range value
 * @param {Function} props.onChange - Callback fired when selection changes
 * @param {string} [props.className] - Additional CSS classes for the container
 * @param {boolean} [props.disabled=false] - Whether the select is disabled
 */
const TimeRangeSelect = ({ value, onChange, className = '', disabled = false }) => {
  // Memoize time range options with labels and formatted date ranges
  // Using original backend-compatible values: today, this_week, this_month, last_month
  const timeRanges = useMemo(() => [
    {
      label: __('Today', 'smashballoon-wpchat-livechat-customer-support'),
      value: 'today',
      range: formatDateRange('today')
    },
    {
      label: __('This Week', 'smashballoon-wpchat-livechat-customer-support'),
      value: 'this_week',
      range: formatDateRange('this_week')
    },
    {
      label: __('This Month', 'smashballoon-wpchat-livechat-customer-support'),
      value: 'this_month',
      range: formatDateRange('this_month')
    },
    {
      label: __('Last Month', 'smashballoon-wpchat-livechat-customer-support'),
      value: 'last_month',
      range: formatDateRange('last_month')
    },
  ], []);

  return (
    <div className={`wpchat:flex wpchat:items-center ${className}`}>
      {/* Calendar Icon Container */}
      <div className="wpchat:bg-white wpchat:border wpchat:border-gray-200 wpchat:rounded-s-lg wpchat:border-e-0 wpchat:h-[38px] wpchat:w-[40px] wpchat:flex wpchat:items-center wpchat:justify-center">
        <SvgLoader
          name="calendar"
          className="wpchat:w-5 wpchat:h-5 wpchat:relative wpchat:start-[1px]"
          aria-hidden="true"
        />
      </div>

      {/* React Aria Select Component */}
      <Select
        selectedKey={value}
        onSelectionChange={onChange}
        aria-label={__('Select time range', 'smashballoon-wpchat-livechat-customer-support')}
        className="wpchat:min-w-[198px] wpchat:bg-white wpchat:rounded-e-lg wpchat:h-[38px]"
        isDisabled={disabled}
        btnClassName="wpchat:w-full wpchat:rounded-s-none wpchat:h-[38px] wpchat:px-3 wpchat:py-2 wpchat:justify-between hover:wpchat:bg-gray-50"
      >
        {timeRanges.map(({ value: rangeValue, label, range }) => (
          <SelectItem key={rangeValue} id={rangeValue}>
            <div className="wpchat:flex wpchat:items-center wpchat:justify-between wpchat:w-full wpchat:gap-4">
              <span className="wpchat:font-semibold wpchat:text-sm">{label}</span>
              <span className="wpchat:text-sm wpchat:text-gray-500">{range}</span>
            </div>
          </SelectItem>
        ))}
      </Select>
    </div>
  );
};

/**
 * Format date range based on the selected time range option
 * Uses smart formatting rules: same month shows "5–11 Nov", different months shows "Oct 31 – Nov 11"
 */
function formatDateRange(rangeType) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formatDate = (date, includeYear = false) => {
    const month = MONTHS[date.getMonth()];
    const day = date.getDate();

    if (includeYear && date.getFullYear() !== currentYear) {
      return `${month} ${day}, ${date.getFullYear()}`;
    }
    return `${month} ${day}`;
  };

  const formatRange = (startDate, endDate) => {
    if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
      return `${startDate.getDate()}–${endDate.getDate()} ${MONTHS[endDate.getMonth()]}`;
    }
    return `${formatDate(startDate, true)} – ${formatDate(endDate, true)}`;
  };

  switch (rangeType) {
    case 'today':
      return formatDate(now);

    case 'this_week':
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return formatRange(weekStart, now);

    case 'this_month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return formatRange(monthStart, now);

    case 'last_month':
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return formatRange(lastMonthStart, lastMonthEnd);

    default:
      return formatDate(now);
  }
}

TimeRangeSelect.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

export default TimeRangeSelect; 