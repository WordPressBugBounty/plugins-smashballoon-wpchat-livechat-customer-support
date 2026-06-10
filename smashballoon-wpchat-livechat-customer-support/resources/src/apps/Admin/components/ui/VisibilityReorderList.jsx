import { Reorder } from 'motion/react';
import SvgLoader from '@Components/SvgLoader';

export function VisibilityReorderList({
  items,
  visibilityMap,
  onReorder,
  onToggleVisibility,
  keyExtractor,
  renderContent,
  emptyMessage,
}) {
  const visibleItems = items.filter((i) => visibilityMap[keyExtractor(i)]);
  const hiddenItems = items.filter((i) => !visibilityMap[keyExtractor(i)]);

  const handleReorder = (newVisible) => {
    onReorder([...newVisible, ...hiddenItems]);
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
      <Reorder.Group
        as="div"
        axis="y"
        values={visibleItems}
        onReorder={handleReorder}
      >
        {visibleItems.map((item) => {
          const key = keyExtractor(item);
          return (
            <Reorder.Item
              key={key}
              value={item}
              className="wpchat:mb-0 wpchat:flex wpchat:cursor-move wpchat:items-center wpchat:gap-3 wpchat:rounded-md wpchat:py-2 wpchat:px-1 hover:wpchat:bg-gray-50"
            >
              <SvgLoader
                name="drag"
                className="wpchat:h-3 wpchat:w-1.5 wpchat:fill-gray-400"
              />
              <button
                type="button"
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
        return (
          <div
            key={key}
            className="wpchat:mb-0 wpchat:flex wpchat:items-center wpchat:gap-3 wpchat:rounded-md wpchat:py-2 wpchat:px-1"
          >
            <SvgLoader name="drag" className="wpchat:h-3 wpchat:w-1.5 wpchat:fill-gray-400" />
            <button
              type="button"
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
