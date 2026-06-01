import React from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@AC/ui/Button';
import { Select, SelectItem } from '@AC/ui/Select';

/**
 * A dropdown select component for performing bulk actions on selected items.
 *
 * @param {Object} props - The component props.
 * @param {Array} props.selected - An array of currently selected items.
 * @param {Function} props.onSelectionChange - Callback function called when the selection changes.
 * @param {Function} props.onApply - Callback function called when an action is applied.
 * @param {Array<{ label: string, value: string }>} [props.options=[]] - Array of action options available for selection.
 *
 * @returns {JSX.Element} The rendered BulkActionSelect component.
 */
export default function BulkActionSelect({ selected, onSelectionChange, onApply, options = [] }) {
  return (
    <div className='wpchat:flex wpchat:gap-1 wpchat:rounded-none'>
      <Select
        selectedKey={selected}
        onSelectionChange={onSelectionChange}
        aria-label={__('Bulk Action', 'smashballoon-wpchat-livechat-customer-support')}
        className='wpchat:rounded-none wpchat:bg-white'
        btnClassName='wpchat:rounded-none'
      >
        {options.map(({ value, label }) => (
          <SelectItem key={value} id={value}>
            {label}
          </SelectItem>
        ))}
      </Select>
      <Button
        onPress={onApply}
        variant='secondary'
        className='wpchat:font-normal wpchat:font-semibold'
      >
        {__('Apply', 'smashballoon-wpchat-livechat-customer-support')}
      </Button>
    </div>
  );
}
