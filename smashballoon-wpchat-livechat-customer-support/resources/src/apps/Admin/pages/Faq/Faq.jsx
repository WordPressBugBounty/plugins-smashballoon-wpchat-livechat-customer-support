import React, { useEffect, useMemo, useState } from 'react';
import { TableBody } from 'react-aria-components';
import { TooltipTrigger } from 'react-aria-components';
import { useNavigate } from 'react-router';
import { __ } from '@wordpress/i18n';
import BulkActionSelect from '@AC/BulkActionSelect';
import EmbeddedFrontend from '@AC/EmbeddedFrontend';
import FaqToken from '@AC/Faq/FaqToken';
import PageLayout from '@AC/PageLayout';
import UpgradeToProDialog from '@AC/UpgradeToProDialog';
import { Button } from '@AC/ui/Button';
import { Dialog } from '@AC/ui/Dialog';
import { Modal } from '@AC/ui/Modal';
import { SideNav } from '@AC/ui/SideNav';
import { Cell, Column, Row, Table, TableHeader } from '@AC/ui/Table';
import { Tooltip } from '@AC/ui/Tooltip';
import ArchiveSkeleton from '@AC/Skeleton/ArchiveSkeleton';
import FaqWelcome from '@AP/Faq/FaqWelcome';
import { HideOnMobile } from '@Components/HideComponent';
import SvgLoader from '@Components/SvgLoader';
import useFaqsStore from '@DataStore/faqs/faqsStore';
import { useChatStore } from '@FDataStore/Chat/chatStore';
import { useEntitlements } from '@AH/useEntitlements';
import { getUpgradeDialogData, upgradeConfigs } from '@AU/upgradeDialogs';
import { cn } from '@Utils/cn';

/**
 * Faq component displays a list of frequently asked questions.
 * Typically used to provide users with quick answers to common inquiries.
 *
 * @component
 * @returns {JSX.Element} The rendered Faq component.
 */
export default function Faq() {
  const navigate = useNavigate();

  //Embedded Frontend
  const setDisableFixed = useChatStore((s) => s.setDisableFixed);
  const setShowChat = useChatStore((s) => s.setShowChat);
  const setInitialRoute = useChatStore((s) => s.setInitialRoute);
  const setShowChatToggle = useChatStore((s) => s.setShowChatToggle);
  const setDisableNavigation = useChatStore((s) => s.setDisableNavigation);
  const setRootClassName = useChatStore((s) => s.setRootClassName);
  const setDisableFaqTracking = useChatStore((s) => s.setDisableFaqTracking);
  const setIsPreviewMode = useChatStore((s) => s.setIsPreviewMode);
  const reset = useChatStore((s) => s.reset);

  const {
    faqs: faqList,
    loading,
    error,
    loadFaqs,
    removeFaq,
    cloneFaq,
    removeFaqs,
    pagination,
    resetLoading,
    resetStore,
  } = useFaqsStore();

  const { faqLimits, hasFaqsEntitlement, isPro: isProPlan } = useEntitlements();


  // Get the appropriate upgrade dialog data
  const upgradeDialogData = getUpgradeDialogData('faqs', {
    isPro: isProPlan,
    currentCount: faqLimits.current,
    maxLimit: faqLimits.max,
    ...upgradeConfigs.faqs,
  });


  //UseState
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenSideNav, setIsOpenSideNav] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [sortDescriptor, setSortDescriptor] = useState({
    column: 'name',
    direction: 'ascending',
  });
  const [selectedAction, setSelectedAction] = useState('bulk-actions');

  const bulkActionOptions = [
    { value: 'bulk-actions', label: 'Bulk Actions' },
    { value: 'delete', label: 'Delete' },
  ];

  const items = useMemo(() => {
    const sorted = [...faqList].sort(
      (a, b) => a[sortDescriptor.column]?.localeCompare?.(b[sortDescriptor.column]) ?? 0,
    );
    return sortDescriptor.direction === 'descending' ? sorted.reverse() : sorted;
  }, [sortDescriptor, faqList]);

  const selectedItems = useMemo(() => {
    if (selectedKeys === 'all') {
      return items.map((item) => item.id);
    }

    return items.filter((item) => selectedKeys.has(item.id)).map((item) => item.id);
  }, [selectedKeys, items]);

  // UseEffect
  useEffect(() => {
    reset(); // Reset chat state including messages
    setDisableFixed(true);
    setShowChat(true);
    setInitialRoute('/');
    setShowChatToggle(true);
    setDisableNavigation(false);
    setRootClassName('wpchat:flex wpchat:justify-center');
    setDisableFaqTracking(true);
    setIsPreviewMode(true); // Set preview mode to prevent analytics logging
  }, [isOpenSideNav]);

  // Load FAQs on component mount with proper cleanup
  useEffect(() => {
    // Reset chat state when component mounts (e.g., when coming back from single FAQ)
    reset();
    
    // Reset store to ensure clean state when navigating from other routes
    resetStore();

    // Load FAQs for the first page
    loadFaqs(1);

    // Cleanup function
    return () => {
      resetLoading();
    };
  }, []); // Empty dependency array - only run on mount

  if (loading) return <ArchiveSkeleton />;
  if (faqList.length === 0) return <FaqWelcome />;

  // Internal Functions
  const handleSelectionChange = (key) => {
    setSelectedAction(key);
  };

  const handleApply = async () => {
    if (!selectedAction || selectedAction === 'bulk-actions') {
      alert('Please select an action first.');
      return;
    }

    if (selectedItems.length === 0) {
      alert('Please select at least one FAQ to apply the action.');
      return;
    }

    if (selectedAction === 'delete') {
      await removeFaqs(selectedItems);
    }
  };

  async function handleDeleteFaq(faqId) {
    await removeFaq(faqId);
  }

  async function handleCloneFaq(faqId) {
    // Check if user can create more FAQs before cloning
    if (!faqLimits.canCreateMore) {
      setIsOpen(true);
      return;
    }
    await cloneFaq(faqId);
  }

  function HeaderButtons() {
    return (
      <div className='wpchat:flex wpchat:gap-2'>
        <Button
          onPress={() => {
            // Check if user can create more FAQs
            if (!faqLimits.canCreateMore) {
              setIsOpen(true);
            } else {
              navigate('/faqs/create');
            }
          }}
        >
          <SvgLoader name='plus' />
          <HideOnMobile>
            {__('New Question', 'smashballoon-wpchat-livechat-customer-support')}
          </HideOnMobile>
        </Button>

        <Button variant='secondary' onPress={() => setIsOpenSideNav((prev) => !prev)}>
          <SvgLoader name='displayEye' />
          <HideOnMobile>
            {__('Preview', 'smashballoon-wpchat-livechat-customer-support')}
          </HideOnMobile>
        </Button>
      </div>
    );
  }

  return (
    <PageLayout
      breadcrumb={[{ label: __('Frequent Questions', 'smashballoon-wpchat-livechat-customer-support') }]}
      HeaderButtons={HeaderButtons}
      className='wpchat:max-w-full wpchat:px-4 wpchat:md:px-13 wpchat:md:pt-6'
    >
      <div className='wpchat:grid wpchat:grid-cols-1 wpchat:gap-x-2 wpchat:lg:gap-x-5 wpchat:xl:grid-cols-[1fr_315px]'>
        <div className='wpchat:mb-3'>
        <div className='wpchat:mb-3 wpchat:grid wpchat:grid-cols-2 wpchat:items-center wpchat:gap-1'>
          <BulkActionSelect
            selected={selectedAction}
            onSelectionChange={handleSelectionChange}
            onApply={handleApply}
            options={bulkActionOptions}
          />
          <span className='wpchat:admin-5 wpchat:text-end wpchat:text-xs wpchat:leading-relaxed'>
            {pagination?.totalFaqs + ' ' + __('Items')}
          </span>
        </div>
        <Table
          aria-label='FAQs'
          selectionMode='multiple'
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
        >
          <TableHeader className='wpchat:border-b wpchat:border-solid wpchat:border-gray-200'>
            <Column id='name' isRowHeader allowsSorting>
              {__('Question', 'smashballoon-wpchat-livechat-customer-support')}
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
                <Cell className={cn('wpchat:py-5 wpchat:ps-5')}>
                  {row.question && (
                    <h5
                      className='wpchat:text-wp-blue-500 wpchat:m-0 wpchat:cursor-pointer wpchat:text-sm wpchat:font-semibold'
                      onClick={() => navigate(`/faqs/edit/${row.id}`)}
                    >
                      {row.question}
                    </h5>
                  )}
                  {row.answer && (
                    <p className='wpchat:m-0 wpchat:text-sm wpchat:text-gray-500'>
                      {row.answer.length > 150 ? `${row.answer.substring(0, 150)}...` : row.answer}
                    </p>
                  )}
                </Cell>
                <Cell
                  className={cn('wpchat:flex wpchat:items-start wpchat:justify-end wpchat:py-5')}
                >
                  <div
                    className={cn(
                      'wpchat:flex wpchat:justify-end wpchat:gap-1 wpchat:pe-5 wpchat:align-middle',
                    )}
                  >
                    <TooltipTrigger delay={0}>
                      <Button
                        className='wpchat:px-2.5 wpchat:py-2.5 wpchat:text-xs'
                        variant='secondary'
                        onPress={() => navigate(`/faqs/edit/${row.id}`)}
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
                    <TooltipTrigger delay={0}>
                      <Button
                        className='wpchat:px-2.5 wpchat:py-2.5 wpchat:text-xs'
                        variant='secondary'
                        onPress={() => {
                          if (!faqLimits.canCreateMore) {
                            setIsOpen(true);
                          } else {
                            handleCloneFaq(row.id);
                          }
                        }}
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
                    <TooltipTrigger delay={0}>
                      <Button
                        className='[&_svg]:fill-amber-700 wpchat:px-2.5 wpchat:py-2.5 wpchat:text-xs'
                        variant='danger'
                        onPress={() => handleDeleteFaq(row.id)}
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

        {pagination.totalPages > 1 && (
          <div className='wpchat:mt-2 wpchat:flex wpchat:justify-end'>
            <div className='wpchat:flex wpchat:items-center-safe wpchat:gap-1'>
              <Button
                onPress={() => loadFaqs(1)}
                isDisabled={pagination.currentPage === 1}
                variant='secondary'
                className='wpchat:font-normal'
              >
                {__('«', 'smashballoon-wpchat-livechat-customer-support')}
              </Button>

              <Button
                onPress={() => loadFaqs(pagination.currentPage - 1)}
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
                onPress={() => loadFaqs(pagination.currentPage + 1)}
                isDisabled={pagination.currentPage === pagination.totalPages}
                variant='secondary'
                className='wpchat:font-normal'
              >
                {__('›', 'smashballoon-wpchat-livechat-customer-support')}
              </Button>

              <Button
                onPress={() => loadFaqs(pagination.totalPages)}
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
        
        {/* Sticky Section */}
        <div className='wpchat:static wpchat:md:sticky wpchat:md:top-24'>
          <FaqToken />
        </div>
      </div>
      <SideNav isOpen={isOpenSideNav} setIsOpen={setIsOpenSideNav} showLoading={true}>
        <h2 className='wpchat:m-0 wpchat:mb-9 wpchat:flex wpchat:items-center wpchat:gap-1.5 wpchat:border-b-1 wpchat:border-gray-200 wpchat:py-4 wpchat:ps-8 wpchat:text-lg wpchat:leading-relaxed wpchat:font-semibold wpchat:text-gray-900'>
          <SvgLoader
            name='chevronLeft'
            className='wpchat:h-[1.3em] wpchat:w-[1.3em] wpchat:cursor-pointer wpchat:rtl:rotate-180'
            onClick={() => setIsOpenSideNav(false)}
          />
          {__('Preview', 'smashballoon-wpchat-livechat-customer-support')}
        </h2>
        <EmbeddedFrontend />
      </SideNav>
      <Modal isOpen={isOpen} onOpenChange={setIsOpen} isDismissable>
        <Dialog>
          <UpgradeToProDialog {...upgradeDialogData} />
        </Dialog>
      </Modal>
    </PageLayout>
  );
}
