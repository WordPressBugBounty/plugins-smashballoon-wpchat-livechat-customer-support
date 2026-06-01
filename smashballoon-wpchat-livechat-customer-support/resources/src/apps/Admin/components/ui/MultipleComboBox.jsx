import clsx from 'clsx';
import { useCombobox, useMultipleSelection } from 'downshift';
import debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';
import SvgLoader from '@Components/SvgLoader';
import { cn } from '@Utils/cn';

const MAX_VISIBLE_ITEMS = 5;

/**
 * SelectedItem component for displaying a selected item with remove button
 */
const SelectedItem = ({ item, onRemove, getSelectedItemProps, index }) => {
  if (!item || !item.title) return null;

  return (
    <span
      className='wpchat:rounded-sm wpchat:border-1 wpchat:border-b-2 wpchat:border-gray-200 wpchat:bg-white wpchat:py-1 wpchat:pe-1.5 wpchat:ps-3 wpchat:text-gray-800'
      key={`selected-item-${index}`}
      {...getSelectedItemProps({
        selectedItem: item,
        index,
      })}
    >
      {item.title}
      <span
        className='wpchat:cursor-pointer wpchat:px-1'
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item);
        }}
        aria-label={`Remove ${item.title}`}
      >
        &#10005;
      </span>
    </span>
  );
};

/**
 * ToggleButton component for showing/hiding additional selected items
 */
const ToggleButton = ({ showAll, itemCount, onToggle }) => {
  const hiddenCount = itemCount - MAX_VISIBLE_ITEMS;

  return (
    <button
      type='button'
      onClick={onToggle}
      className='wpchat:flex wpchat:items-center wpchat:gap-1 wpchat:rounded-sm wpchat:border-1 wpchat:border-b-2 wpchat:border-gray-200 wpchat:bg-[#F9F9FA] wpchat:py-1 wpchat:pe-1.5 wpchat:ps-3 wpchat:text-sm wpchat:text-gray-800'
    >
      <span>
        {showAll
          ? __('Hide ' + hiddenCount + ' items', 'smashballoon-wpchat-livechat-customer-support')
          : __('Show ' + hiddenCount + ' more', 'smashballoon-wpchat-livechat-customer-support')}
      </span>
      <SvgLoader name={showAll ? 'chevronUp' : 'chevronDown'} className='wpchat:h-4 wpchat:w-4' />
    </button>
  );
};

/**
 * DropdownMenu component for displaying search results
 */
const DropdownMenu = ({
  isOpen,
  items,
  loading,
  isSearchActive,
  highlightedIndex,
  getItemProps,
  getMenuProps,
  menuRef,
  wrapperRef,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className='wpchat:absolute wpchat:z-10 wpchat:mt-1 wpchat:max-h-[265px] wpchat:w-[278px] wpchat:overflow-y-auto wpchat:rounded-lg wpchat:bg-white wpchat:shadow-md'
      style={{
        position: 'fixed',
        top: wrapperRef.current?.getBoundingClientRect().bottom + 'px',
        left: wrapperRef.current?.getBoundingClientRect().left + 'px',
      }}
      {...getMenuProps({ ref: menuRef })}
    >
      {items.length > 0 ? (
        <ul className='wpchat:p-0'>
          {items.map((item, index) => {
            const { title, description, value } = item;
            return (
              <li
                className={clsx(
                  highlightedIndex === index && 'wpchat:bg-wp-blue-200',
                  'wpchat:mb-0 wpchat:flex wpchat:cursor-pointer wpchat:flex-col wpchat:border-b wpchat:border-gray-200 wpchat:px-6 wpchat:py-3',
                )}
                key={`${value || index}`}
                {...getItemProps({ item, index })}
              >
                {title && (
                  <h6 className='wpchat:m-0 wpchat:mb-0.5 wpchat:truncate wpchat:overflow-hidden wpchat:text-sm wpchat:leading-relaxed wpchat:font-semibold wpchat:whitespace-nowrap wpchat:text-gray-900'>
                    {title}
                  </h6>
                )}
                {description && (
                  <p className='wpchat:m-0 wpchat:truncate wpchat:overflow-hidden wpchat:text-xs wpchat:whitespace-nowrap wpchat:text-gray-500'>
                    {description}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className='wpchat:p-5'>
          <SvgLoader
            name='searchNoResults'
            className='wpchat:mb-3 wpchat:h-10 wpchat:w-10 wpchat:fill-gray-500'
          />
          <h6 className='wpchat:mt-0 wpchat:mb-1 wpchat:text-sm wpchat:leading-relaxed wpchat:font-semibold wpchat:text-gray-900'>
            {loading &&
              isSearchActive &&
              __('Loading...', 'smashballoon-wpchat-livechat-customer-support')}
            {isSearchActive &&
              !loading &&
              __('No results found', 'smashballoon-wpchat-livechat-customer-support')}
            {!isSearchActive && __('Type to search...', 'smashballoon-wpchat-livechat-customer-support')}
          </h6>
          <p className='wpchat:m-0 wpchat:text-sm wpchat:leading-relaxed wpchat:text-gray-500'>
            {isSearchActive
              ? __(
                  'Looks like we cannot find a page with that name. Double check your spellings or try a different term.',
                  'smashballoon-wpchat-livechat-customer-support',
                )
              : __(
                  'Start typing to search for a page, category, tag or custom post type.',
                  'smashballoon-wpchat-livechat-customer-support',
                )}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * MultipleComboBox component
 *
 * Renders a combo box that allows users to select multiple items from a list.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Array} props.itemsList - Full list of selectable items
 * @param {string} props.label - Label displayed above or beside the combo box
 * @param {string} props.placeholder - Placeholder text displayed when no items are selected
 * @param {boolean} props.loading - Whether the component is in a loading state
 * @param {Function} props.onInputChange - Callback when input value changes
 * @param {Function} props.onScrollEnd - Callback when user scrolls to the end of the list
 * @param {boolean} props.hasMore - Whether there are more items to load
 * @param {boolean} props.isSearchActive - Whether search is currently active
 * @param {Array} props.selectedItems - Array of currently selected items
 * @param {Function} props.onSelectedItemsChange - Callback when selected items change
 * @returns {JSX.Element} Rendered MultipleComboBox component
 */
export function MultipleComboBox({
  itemsList = [],
  label,
  placeholder,
  loading = false,
  onInputChange,
  onScrollEnd,
  hasMore = false,
  isSearchActive = false,
  selectedItems = [],
  onSelectedItemsChange,
}) {
  // Refs
  const wrapperRef = useRef(null);
  const menuRef = useRef(null);
  const spanRef = useRef(null);

  // State
  const [inputValue, setInputValue] = useState('');
  const [inputWidth, setInputWidth] = useState(20);
  const [isFocused, setIsFocused] = useState(false);
  const [showAllSelected, setShowAllSelected] = useState(false);

  // Filter out already selected items from the list
  const itemsToRender = useMemo(() => {
    const selectedIds = selectedItems.map((item) => item.id);
    return itemsList.filter((item) => !selectedIds.includes(item.id));
  }, [itemsList, selectedItems]);

  // Handle focus events for the combo box
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleFocusIn = () => {
      setIsFocused(true);
      if (onInputChange) {
        onInputChange(inputValue);
      }
    };

    const handleFocusOut = (e) => {
      const isFocusLeavingWrapper = !wrapper.contains(e.relatedTarget);
      const isFocusGoingToMenu = menuRef.current && menuRef.current.contains(e.relatedTarget);

      if (isFocusLeavingWrapper && !isFocusGoingToMenu) {
        setTimeout(() => {
          if (
            !document.activeElement ||
            (!wrapper.contains(document.activeElement) &&
              !menuRef.current?.contains(document.activeElement))
          ) {
            setIsFocused(false);
          }
        }, 0);
      }
    };

    wrapper.addEventListener('focusin', handleFocusIn);
    wrapper.addEventListener('focusout', handleFocusOut);

    return () => {
      wrapper.removeEventListener('focusin', handleFocusIn);
      wrapper.removeEventListener('focusout', handleFocusOut);
    };
  }, [wrapperRef.current, menuRef.current, onInputChange, inputValue]);

  // Update input width based on content
  useEffect(() => {
    if (spanRef.current) {
      const width = spanRef.current.offsetWidth;
      setInputWidth(width + 5);
    }
  }, [inputValue, isFocused, selectedItems]);

  useEffect(() => {
    const node = spanRef.current;
    if (!node) return;

    const observer = new ResizeObserver(() => {
      setInputWidth(node.offsetWidth + 5);
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Multiple selection hook
  const { getSelectedItemProps, getDropdownProps } = useMultipleSelection({
    selectedItems,
    onStateChange({ selectedItems: newSelectedItems, type }) {
      switch (type) {
        case useMultipleSelection.stateChangeTypes.SelectedItemKeyDownBackspace:
        case useMultipleSelection.stateChangeTypes.SelectedItemKeyDownDelete:
        case useMultipleSelection.stateChangeTypes.DropdownKeyDownBackspace:
        case useMultipleSelection.stateChangeTypes.FunctionRemoveSelectedItem:
          onSelectedItemsChange(newSelectedItems);
          break;
        default:
          break;
      }
    },
  });

  // Combobox hook
  const {
    isOpen,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox({
    items: itemsToRender,
    itemToString(item) {
      return item ? item.title : '';
    },
    defaultHighlightedIndex: 0,
    selectedItem: null,
    inputValue,
    stateReducer(state, actionAndChanges) {
      const { changes, type } = actionAndChanges;

      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          return {
            ...changes,
            isOpen: true,
            highlightedIndex: 0,
          };
        default:
          return changes;
      }
    },
    onStateChange({ inputValue: newInputValue, type, selectedItem: newSelectedItem }) {
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputBlur:
          if (newSelectedItem) {
            const itemAlreadySelected = selectedItems.some(
              (item) => item.id === newSelectedItem.id,
            );
            if (!itemAlreadySelected) {
              if (onSelectedItemsChange) {
                onSelectedItemsChange([newSelectedItem, ...selectedItems]);
              }
            }
            setInputValue('');
            if (onInputChange) {
              onInputChange('');
            }
          }
          break;
        case useCombobox.stateChangeTypes.InputChange:
          setInputValue(newInputValue);
          if (onInputChange) {
            onInputChange(newInputValue);
          }
          break;
        default:
          break;
      }
    },
  });

  // Handle scroll to load more items
  const handleScroll = useCallback(() => {
    const menu = menuRef.current;
    if (menu && hasMore && onScrollEnd && !loading) {
      const { scrollTop, clientHeight, scrollHeight } = menu;
      const scrollThreshold = 20;
      if (scrollHeight - scrollTop - clientHeight <= scrollThreshold) {
        onScrollEnd();
      }
    }
  }, [hasMore, onScrollEnd, loading]);

  // Create a debounced version of handleScroll
  const debouncedHandleScroll = useMemo(() => debounce(handleScroll, 100), [handleScroll]);

  // Attach and clean up the scroll listener
  useEffect(() => {
    const menu = menuRef.current;
    if (menu) {
      menu.addEventListener('scroll', debouncedHandleScroll);
      return () => {
        menu.removeEventListener('scroll', debouncedHandleScroll);
        debouncedHandleScroll.cancel();
      };
    }
    return () => {
      debouncedHandleScroll.cancel();
    };
  }, [debouncedHandleScroll]);

  const handleRemoveItem = (item) => {
    if (onSelectedItemsChange) {
      onSelectedItemsChange(selectedItems.filter((i) => i.id !== item.id));
    }
  };

  return (
    <>
      <div className='wpchat:flex wpchat:flex-col wpchat:gap-1'>
        {label && (
          <label
            className='wpchat:mb-2 wpchat:w-fit wpchat:text-sm wpchat:leading-relaxed wpchat:font-semibold wpchat:text-gray-900'
            {...getLabelProps()}
          >
            {label}
          </label>
        )}
        <div className='wpchat:inline-flex wpchat:flex-wrap wpchat:items-center wpchat:gap-2'>
          <div
            className='combobox-wrapper wpchat:border-wp-blue-200 wpchat:bg-wp-light-blue-50 wpchat:text-wp-blue-500 wpchat:flex wpchat:gap-0.5 wpchat:rounded-sm wpchat:border-1 wpchat:border-b-2 wpchat:py-1 wpchat:pe-1.5 wpchat:ps-1.5'
            ref={wrapperRef}
          >
            <SvgLoader
              name={isFocused ? 'searchAlt' : 'plus'}
              className='wpchat:text-wp-blue-500 wpchat:fill-wp-blue-500 wpchat:h-4 wpchat:w-4'
            />
            <input
              value={inputValue}
              placeholder={isFocused ? `Search a ${placeholder}` : `Add ${placeholder}`}
              onFocus={() => setIsFocused(true)}
              className={cn(
                'wpchat:font-semibold wpchat:focus-visible:outline-none',
                isFocused
                  ? 'wpchat:placeholder:text-wp-light-blue-500'
                  : 'wpchat:placeholder:text-wp-blue-500',
              )}
              onBlur={(e) => {
                const root = e.currentTarget.closest('.combobox-wrapper');
                if (!root?.contains(e.relatedTarget)) {
                  setIsFocused(false);
                }
              }}
              style={{ width: `${inputWidth}px` }}
              {...getInputProps(getDropdownProps({ preventKeyAction: isOpen }))}
            />
            <span
              ref={spanRef}
              className='wpchat:invisible wpchat:absolute wpchat:h-0 wpchat:overflow-hidden wpchat:text-sm wpchat:whitespace-pre'
            >
              {inputValue || (isFocused ? `Search a ${placeholder}` : `Add ${placeholder}`)}
            </span>
            <button
              aria-label='toggle menu'
              className='wpchat:hidden wpchat:px-2'
              type='button'
              {...getToggleButtonProps()}
            >
              &#8595;
            </button>
          </div>
          {selectedItems
            .slice(0, showAllSelected ? selectedItems.length : MAX_VISIBLE_ITEMS)
            .map((item, index) => (
              <SelectedItem
                key={`selected-item-${index}`}
                item={item}
                index={index}
                onRemove={handleRemoveItem}
                getSelectedItemProps={getSelectedItemProps}
              />
            ))}
          {selectedItems.length > MAX_VISIBLE_ITEMS && (
            <ToggleButton
              showAll={showAllSelected}
              itemCount={selectedItems.length}
              onToggle={() => setShowAllSelected(!showAllSelected)}
            />
          )}
        </div>
      </div>
      <DropdownMenu
        isOpen={isOpen}
        items={itemsToRender}
        loading={loading}
        isSearchActive={isSearchActive}
        highlightedIndex={highlightedIndex}
        getItemProps={getItemProps}
        getMenuProps={getMenuProps}
        menuRef={menuRef}
        wrapperRef={wrapperRef}
      />
    </>
  );
}
