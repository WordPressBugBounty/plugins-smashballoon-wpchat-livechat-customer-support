import React, { useEffect, useMemo, useState } from 'react';
import { TableBody, TooltipTrigger } from 'react-aria-components';
import { useNavigate } from 'react-router';
import { __ } from '@wordpress/i18n';
import BulkActionSelect from '@AC/BulkActionSelect';
import PageLayout from '@AC/PageLayout';
import { Button } from '@AC/ui/Button';
import { Cell, Column, Row, Table, TableHeader } from '@AC/ui/Table';
import { Tooltip } from '@AC/ui/Tooltip';
import FunnelWelcome from './FunnelWelcome';

import ArchiveSkeleton from '@AC/Skeleton/ArchiveSkeleton';
import { HideOnMobile } from '@Components/HideComponent';
import SvgLoader from '@Components/SvgLoader';
import useFunnelsStore from '@DataStore/funnels/funnelsStore';
import { useEntitlements } from '@AH/useEntitlements';
import { cn } from '@Utils/cn';
import { isPro } from '@Utils/isPro';

/**
 * Funnel component displays a list of Chat Funnels.
 * Includes bulk actions, table listing, pagination, and pro upgrade prompts.
 *
 * @component
 * @returns {JSX.Element} The rendered Funnel component.
 */
export default function Funnel() {
  const navigate = useNavigate();
  const {
    funnels: funnelList,
    loading,
    error,
    loadFunnels,
    removeFunnel,
    cloneFunnel,
    removeFunnels,
    pagination,
    resetFunnelWithDummyBlock,
    resetLoading,
    resetStore,
  } = useFunnelsStore();

  const { funnelLimits, hasFunnelsEntitlement, isPro: isProPlan } = useEntitlements();

  
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [sortDescriptor, setSortDescriptor] = useState({ column: 'name', direction: 'ascending' });
  const [selectedAction, setSelectedAction] = useState('bulk-actions');

  const bulkActionOptions = useMemo(
    () => [
      { value: 'bulk-actions', label: 'Bulk Actions' },
      { value: 'delete', label: 'Delete' },
    ],
    [],
  );


  // Sorted items based on selected column and direction
  const items = useMemo(() => {
    const sorted = [...funnelList].sort(
      (a, b) => a[sortDescriptor.column]?.localeCompare?.(b[sortDescriptor.column]) ?? 0,
    );
    return sortDescriptor.direction === 'descending' ? sorted.reverse() : sorted;
  }, [sortDescriptor, funnelList]);

  // Get selected item IDs
  const selectedItems = useMemo(() => {
    if (selectedKeys === 'all') return items.map((item) => item.id);
    return items.filter((item) => selectedKeys.has(item.id)).map((item) => item.id);
  }, [selectedKeys, items]);



  /** Handle bulk action selection */
  const handleSelectionChange = (key) => setSelectedAction(key);

  /** Apply the selected bulk action */
  const handleApply = async () => {
    if (!selectedAction || selectedAction === 'bulk-actions')
      return alert('Please select an action first.');
    if (!selectedItems.length)
      return alert('Please select at least one Funnel to apply the action.');
    if (selectedAction === 'delete') await removeFunnels(selectedItems);
  };

  /** Delete a single funnel */
  const handleDeleteFunnel = async (funnelId) => await removeFunnel(funnelId);

  /** Clone a single funnel */
  const handleCloneFunnel = async (funnelId) => {
    // Check if user can create more funnels before cloning
    if (!hasFunnelsEntitlement || !funnelLimits?.canCreateMore) {
      setIsOpen(true);
      return;
    }
    await cloneFunnel(funnelId);
  };

  /** Header buttons for creating new funnel */
  const HeaderButtons = () => (
    <div className='wpchat:flex wpchat:gap-2'>
      <Button
        onPress={() => {
          // Check if user has funnels entitlement and can create more
          if (!hasFunnelsEntitlement || !funnelLimits?.canCreateMore) {
            setIsOpen(true);
          } else {
            resetFunnelWithDummyBlock();
            navigate('/funnels/create');
          }
        }}
      >
        <SvgLoader name='plus' />
        <HideOnMobile>{__('New Funnel', 'smashballoon-wpchat-livechat-customer-support')}</HideOnMobile>
      </Button>
    </div>
  );

  // Load funnels on component mount with proper cleanup
  useEffect(() => {
    // Reset store to ensure clean state when navigating from other routes
    resetStore();

    // Load funnels for the first page if user has entitlement
    if (hasFunnelsEntitlement) {
      loadFunnels(1);
    }

    // Cleanup function
    return () => {
      resetLoading();
    };
  }, []); // Empty dependency array - only run on mount

  if (loading) return <ArchiveSkeleton />;
  // Show welcome screen for users without funnels entitlement or when no funnels exist
  if (!hasFunnelsEntitlement || funnelList.length === 0) return <FunnelWelcome />;

  return (
    <PageLayout
      breadcrumb={[{ label: __('Chat Funnels', 'smashballoon-wpchat-livechat-customer-support') }]}
      HeaderButtons={HeaderButtons}
      className='wpchat:max-w-full wpchat:px-4 wpchat:md:px-13 wpchat:md:pt-6'
    >
      <div className='wpchat:mb-3'>
        {/* Bulk actions and total items */}
        <div className='wpchat:mb-3 wpchat:grid wpchat:grid-cols-2 wpchat:items-center wpchat:gap-1'>
          <BulkActionSelect
            selected={selectedAction}
            onSelectionChange={handleSelectionChange}
            onApply={handleApply}
            options={bulkActionOptions}
          />
          <span className='wpchat:admin-5 wpchat:text-end wpchat:text-xs wpchat:leading-relaxed'>
            {pagination?.totalFunnels + ' ' + __('Items')}
          </span>
        </div>

        {/* Funnels table */}
        <Table
          aria-label='Funnels'
          selectionMode='multiple'
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
        >
          <TableHeader className='wpchat:border-b wpchat:border-solid wpchat:border-gray-200'>
            <Column id='name' isRowHeader allowsSorting>
              {__('Name', 'smashballoon-wpchat-livechat-customer-support')}
            </Column>
            <Column id='visibility'>
              {__('Visibility', 'smashballoon-wpchat-livechat-customer-support')}
            </Column>
            <Column id='options'></Column>
          </TableHeader>

          <TableBody items={items.map((item, i) => ({ ...item, key: item.id, _index: i }))}>
            {(row) => (
              <Row
                key={row.id}
                onAction={() => ''}
                className={cn(
                  row._index % 2 === 0 ? 'wpchat:bg-gray-100' : 'wpchat:bg-white',
                  'wpchat:outline-wp-light-blue-500-20 wpchat:border-b wpchat:border-solid wpchat:border-gray-200 wpchat:py-5 wpchat:ps-5 wpchat:align-top',
                )}
              >
                <Cell className='wpchat:py-5 wpchat:ps-5'>
                  {row.name && (
                    <h5
                      className='wpchat:text-wp-blue-500 wpchat:m-0 wpchat:cursor-pointer wpchat:text-sm wpchat:font-semibold'
                      onClick={() => navigate(`/funnels/${row.id}`)}
                    >
                      {row.name}
                    </h5>
                  )}
                </Cell>
                <Cell className='wpchat:py-5 wpchat:ps-5'>
                  {/* Visibility tags not available in free tier */}
                </Cell>
                <Cell className='wpchat:flex wpchat:items-start wpchat:justify-end wpchat:py-5'>
                  <div className='wpchat:flex wpchat:justify-end wpchat:gap-1 wpchat:pe-5 wpchat:align-middle'>
                    <TooltipTrigger delay={0}>
                      <Button
                        className='wpchat:px-2.5 wpchat:py-2.5 wpchat:text-xs'
                        variant='secondary'
                        onPress={() => navigate(`/funnels/${row.id}`)}
                      >
                        <SvgLoader
                          name='editOutline'
                          className='wpchat:h-[1.3em] wpchat:w-[1.3em]'
                        />
                      </Button>
                      <Tooltip placement='top'>
                        {__('Edit', 'smashballoon-wpchat-livechat-customer-support')}
                      </Tooltip>
                    </TooltipTrigger>

                    {hasFunnelsEntitlement && (
                      <TooltipTrigger delay={0}>
                        <Button
                          className='wpchat:px-2.5 wpchat:py-2.5 wpchat:text-xs'
                          variant='secondary'
                          onPress={() => handleCloneFunnel(row.id)}
                        >
                          <SvgLoader
                            name='baselineContentCopy'
                            className='wpchat:h-[1.3em] wpchat:w-[1.3em]'
                          />
                        </Button>
                        <Tooltip placement='top'>
                          {__('Clone', 'smashballoon-wpchat-livechat-customer-support')}
                        </Tooltip>
                      </TooltipTrigger>
                    )}

                    <TooltipTrigger delay={0}>
                      <Button
                        className='wpchat:px-2.5 wpchat:py-2.5 wpchat:text-xs'
                        variant='danger'
                        onPress={() => handleDeleteFunnel(row.id)}
                      >
                        <SvgLoader
                          name='deleteOutline'
                          className='wpchat:h-[1.3em] wpchat:w-[1.3em]'
                        />
                      </Button>
                      <Tooltip placement='top'>
                        {__('Delete', 'smashballoon-wpchat-livechat-customer-support')}
                      </Tooltip>
                    </TooltipTrigger>
                  </div>
                </Cell>
              </Row>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {isPro && (
          <div className='wpchat:mt-2 wpchat:flex wpchat:justify-end'>
            <div className='wpchat:flex wpchat:items-center-safe wpchat:gap-1'>
              <Button
                onPress={() => loadFunnels(1)}
                isDisabled={pagination.currentPage === 1}
                variant='secondary'
                className='wpchat:font-normal'
              >
                {__('«', 'smashballoon-wpchat-livechat-customer-support')}
              </Button>
              <Button
                onPress={() => loadFunnels(pagination.currentPage - 1)}
                isDisabled={pagination.currentPage === 1}
                variant='secondary'
                className='wpchat:font-normal'
              >
                {__('‹', 'smashballoon-wpchat-livechat-customer-support')}
              </Button>
              <div className='wpchat:text-xs wpchat:leading-relaxed'>
                {pagination.currentPage} {__('of', 'smashballoon-wpchat-livechat-customer-support')}{' '}
                {pagination.totalPages}
              </div>
              <Button
                onPress={() => loadFunnels(pagination.currentPage + 1)}
                isDisabled={pagination.currentPage === pagination.totalPages}
                variant='secondary'
                className='wpchat:font-normal'
              >
                {__('›', 'smashballoon-wpchat-livechat-customer-support')}
              </Button>
              <Button
                onPress={() => loadFunnels(pagination.totalPages)}
                isDisabled={pagination.currentPage === pagination.totalPages}
                variant='secondary'
                className='wpchat:font-normal'
              >
                {__('»', 'smashballoon-wpchat-livechat-customer-support')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
