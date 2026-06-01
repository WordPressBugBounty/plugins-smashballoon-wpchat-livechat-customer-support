import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { useNavigate } from 'react-router';
import { __, sprintf } from '@wordpress/i18n';
import ContentTooltip from '@AC/ContentTooltip';
import FaqCreateEdit from '@AC/Faq/FaqCreateEdit';
import UpgradeToProDialog from '@AC/UpgradeToProDialog';
import { Button } from '@AC/ui/Button';
import { Dialog } from '@AC/ui/Dialog';
import { Modal } from '@AC/ui/Modal';
import { useBodyBackground } from '@AH/useBodyBackground';
import { useEntitlements } from '@AH/useEntitlements';
import { getUpgradeDialogData, upgradeConfigs } from '@AU/upgradeDialogs';
import { HideOnDesktop, HideOnMobile } from '@Components/HideComponent';
import SvgLoader from '@Components/SvgLoader';
import useFaqsStore from '@DataStore/faqs/faqsStore';

/**
 * FaqSingle component provides the interface for creating or editing a FAQ.
 *
 * @component
 * @returns {JSX.Element} The rendered FaqSingle component.
 */
export default function FaqSingle() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addFaq, editFaq } = useFaqsStore();
  const formRef = useRef();
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTooltip, setSaveTooltip] = useState(false);
  const [saveTooltipText, setSaveTooltipText] = useState('');
  const [isError, setIsError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const mode = location.pathname.includes('/create') ? 'Create' : 'Edit';

  const { faqLimits, isPro: isProPlan } = useEntitlements();

  // Get the appropriate upgrade dialog data
  const upgradeDialogData = getUpgradeDialogData('faqs', {
    isPro: isProPlan,
    currentCount: faqLimits.current,
    maxLimit: faqLimits.max,
    ...upgradeConfigs.faqs,
  });

  useBodyBackground('#fff');

  useEffect(() => {
    // Check if we came from a successful create operation
    if (location.state?.showSuccessMessage) {
      setIsError(false);
      setSaveTooltipText(
        location.state.successMessage ||
          __('FAQ Saved Successfully', 'smashballoon-wpchat-livechat-customer-support'),
      );
      setTimeout(() => {
        setSaveTooltip(true);
      }, 500);
    } else {
      // Reset tooltip when navigating to a new page without success message
      setSaveTooltip(false);
      setIsError(false);
    }
  }, [location.state]);

  const handleSave = async () => {
    if (!formRef.current) {
      console.error('Form ref not available');
      return;
    }

    const faqData = formRef.current.getData();

    if (!faqData.question || !faqData.answer) {
      console.error('Question and answer are required');
      return;
    }

    // Close tooltip if it's still open from previous save
    setSaveTooltip(false);
    setIsError(false);
    setIsSaving(true);
    try {
      if (mode === 'Create') {
        const createdFaqId = await addFaq(faqData);
        if (createdFaqId) {
          // Navigate immediately to edit mode with success message
          navigate(`/faqs/edit/${createdFaqId}`, {
            replace: true,
            state: {
              showSuccessMessage: true,
              successMessage: __(
                'FAQ Saved Successfully',
                'smashballoon-wpchat-livechat-customer-support',
              ),
            },
          });
        }
      } else {
        await editFaq(id, faqData);
        setIsError(false);
        setTimeout(() => {
          setSaveTooltipText(
            __('FAQ Updated Successfully', 'smashballoon-wpchat-livechat-customer-support'),
          );
        }, 500);
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      setIsError(true);
      setTimeout(() => {
        setSaveTooltipText(
          __(
            '[WPC-FAQ-008] Error Saving FAQ Data',
            'smashballoon-wpchat-livechat-customer-support',
          ) + `: ${error?.message || error}`,
        );
      }, 500);
    } finally {
      setTimeout(() => {
        setIsSaving(false);
        setSaveTooltip(true);
      }, 500);
    }
  };

  function HeaderButtonsLeft() {
    if (!mode) return null;

    return (
      <div className='wpchat:flex wpchat:items-center wpchat:gap-3'>
        <Button variant='secondary' onPress={() => navigate('/faqs')} className='wpchat:px-2'>
          <SvgLoader name='chevronLeft' className='wpchat:rtl:rotate-180' />
        </Button>
        <span className='wpchat:text-base wpchat:font-semibold'>
          {sprintf(__('%s Question', 'smashballoon-wpchat-livechat-customer-support'), mode)}
        </span>
      </div>
    );
  }

  const tooltipContent = (
    <div className='wpchat:relative'>
      <SvgLoader
        name={isError ? 'closeCircle' : 'circleCheck'}
        className={`wpchat:absolute wpchat:top-[-2px] wpchat:start-0 wpchat:h-6 wpchat:w-6 ${
          isError ? 'wpchat:fill-red-500' : 'wpchat:fill-wp-blue-500'
        }`}
      />
      <div className='wpchat:ps-8'>
        <h5 className='wpchat:m-0 wpchat:text-sm wpchat:font-semibold wpchat:text-gray-900'>
          {saveTooltipText}
        </h5>
        {!isError && (
          <Button
            variant='quaternary'
            className='px-3.5 wpchat:bg-wp-blue-50 wpchat:mt-1.5 wpchat:border-0 wpchat:py-1.5 wpchat:text-xs wpchat:leading-relaxed wpchat:outline-0'
            onPress={() => {
              // Check if user can create more FAQs
              if (!faqLimits.canCreateMore) {
                setIsOpen(true);
                setSaveTooltip(false);
              } else {
                navigate('/faqs/create', {
                  replace: true,
                  state: {
                    showSuccessMessage: false,
                  },
                });
              }
            }}
          >
            <SvgLoader name='plus' />
            {__('Add Another FAQ', 'smashballoon-wpchat-livechat-customer-support')}
          </Button>
        )}
      </div>
    </div>
  );

  function HeaderButtons() {
    return (
      <div className='wpchat:flex wpchat:gap-2'>
        <ContentTooltip
          placement='bottom'
          content={tooltipContent}
          className={`wpchat:min-w-[290px] wpchat:rounded-lg wpchat:border-t-2 ${
            isError
              ? 'wpchat:border-red-500 wpchat:p-4'
              : 'wpchat:border-wp-light-blue-500 wpchat:px-4 wpchat:pt-3 wpchat:pb-3.5'
          }`}
          dismissBarColor={isError ? 'wpchat:bg-red-500' : 'wpchat:bg-wp-light-blue-500'}
          isControlled={true}
          isOpen={saveTooltip}
          showArrow={false}
          autoDismiss={5000}
          onDismiss={() => setSaveTooltip(false)}
        >
          <Button
            onPress={handleSave}
            isDisabled={isSaving || !isFormValid}
            isLoading={true === isSaving}
          >
            <HideOnMobile>
              {__('Save Changes', 'smashballoon-wpchat-livechat-customer-support')}
            </HideOnMobile>
            <HideOnDesktop>
              {__('Save', 'smashballoon-wpchat-livechat-customer-support')}
            </HideOnDesktop>
          </Button>
        </ContentTooltip>
        <Button variant='secondary' onPress={() => navigate('/faqs')}>
          {__('Cancel', 'smashballoon-wpchat-livechat-customer-support')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <FaqCreateEdit
        ref={formRef}
        key={id || 'create'}
        HeaderButtons={HeaderButtons}
        id={id}
        initialData={null}
        onValidationChange={setIsFormValid}
        HeaderButtonsLeft={HeaderButtonsLeft}
      />
      <Modal isOpen={isOpen} onOpenChange={setIsOpen} isDismissable>
        <Dialog>
          <UpgradeToProDialog {...upgradeDialogData} />
        </Dialog>
      </Modal>
    </>
  );
}
