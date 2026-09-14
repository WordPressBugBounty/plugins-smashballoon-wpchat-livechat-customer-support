import React, { useState } from 'react';
import { Reorder } from 'motion/react';
import { __, sprintf } from '@wordpress/i18n';
import SvgLoader from '@Components/SvgLoader';

export function VisibilityReorderList({
  items,
  visibilityMap,
  onReorder,
  onToggleVisibility,
  keyExtractor,
  labelExtractor = (item) => item?.name ?? '',
  renderContent,
  emptyMessage,
}) {
  const visibleItems = items.filter((i) => visibilityMap[keyExtractor(i)]);
  const hiddenItems = items.filter((i) => !visibilityMap[keyExtractor(i)]);
  // Announces keyboard reorder results to screen readers
  const [announcement, setAnnouncement] = useState('');

  const handleReorder = (newVisible) => {
    onReorder([...newVisible, ...hiddenItems]);
  };

  // Keyboard alternative to pointer drag: Arrow Up/Down on the drag handle
  const moveItem = (item, delta) => {
    const from = visibleItems.indexOf(item);
    const to = from + delta;
    if (from === -1 || to < 0 || to >= visibleItems.length) {
      return;
    }
    const next = [...visibleItems];
    next.splice(from, 1);
    next.splice(to, 0, item);
    handleReorder(next);
    setAnnouncement(
      sprintf(
        /* translators: 1: item name, 2: new position, 3: total number of items */
        __('%1$s moved to position %2$d of %3$d', 'smashballoon-wpchat-livechat-customer-support'),
        labelExtractor(item),
        to + 1,
        next.length,
      ),
    );
  };

  const handleDragKeyDown = (item) => (event) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      moveItem(item, event.key === 'ArrowUp' ? -1 : 1);
    }
  };

  if (items.length === 0 && emptyMessage) {
    return (
      <p className="wpchat:m-0 wpchat:text-xs wpchat:text-gray-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <div role="status" aria-live="polite" className="wpchat:sr-only">
        {announcement}
      </div>
      <Reorder.Group
        as="div"
        axis="y"
        values={visibleItems}
        onReorder={handleReorder}
      >
        {visibleItems.map((item) => {
          const key = keyExtractor(item);
          const label = labelExtractor(item);
          return (
            <Reorder.Item
              key={key}
              value={item}
              as="div"
              className="wpchat:mb-0 wpchat:flex wpchat:cursor-move wpchat:items-center wpchat:gap-3 wpchat:rounded-md wpchat:py-2 wpchat:px-1 hover:wpchat:bg-gray-50"
            >
              <button
                type="button"
                aria-label={sprintf(
                  /* translators: %s: item name */
                  __('Reorder %s — use arrow keys to move up or down', 'smashballoon-wpchat-livechat-customer-support'),
                  label,
                )}
                onKeyDown={handleDragKeyDown(item)}
                className="wpchat:m-0 wpchat:flex wpchat:cursor-move wpchat:items-center wpchat:border-0 wpchat:bg-transparent wpchat:p-0"
              >
                <SvgLoader
                  name="drag"
                  className="wpchat:h-3 wpchat:w-1.5 wpchat:fill-gray-400"
                />
              </button>
              <button
                type="button"
                aria-label={sprintf(
                  /* translators: %s: item name */
                  __('Hide %s', 'smashballoon-wpchat-livechat-customer-support'),
                  label,
                )}
                onClick={() => onToggleVisibility(key)}
                className="wpchat:flex wpchat:items-center wpchat:justify-center wpchat:border-0 wpchat:bg-transparent wpchat:p-0 wpchat:cursor-pointer"
              >
                <SvgLoader
                  name="displayEye"
                  className="wpchat:h-4 wpchat:w-4 wpchat:fill-wp-blue-500"
                />
              </button>
              {renderContent(item, true)}
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
      {hiddenItems.map((item) => {
        const key = keyExtractor(item);
        const label = labelExtractor(item);
        return (
          <div
            key={key}
            className="wpchat:mb-0 wpchat:flex wpchat:items-center wpchat:gap-3 wpchat:rounded-md wpchat:py-2 wpchat:px-1"
          >
            <SvgLoader name="drag" className="wpchat:h-3 wpchat:w-1.5 wpchat:fill-gray-400" />
            <button
              type="button"
              aria-label={sprintf(
                /* translators: %s: item name */
                __('Show %s', 'smashballoon-wpchat-livechat-customer-support'),
                label,
              )}
              onClick={() => onToggleVisibility(key)}
              className="wpchat:flex wpchat:items-center wpchat:justify-center wpchat:border-0 wpchat:bg-transparent wpchat:p-0 wpchat:cursor-pointer"
            >
              <SvgLoader
                name="displayEyeOff"
                className="wpchat:h-4 wpchat:w-4 wpchat:fill-gray-500"
              />
            </button>
            {renderContent(item, false)}
          </div>
        );
      })}
    </>
  );
}
