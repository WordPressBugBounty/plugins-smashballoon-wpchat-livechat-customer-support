import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useLocation } from 'react-router';
import { __ } from '@wordpress/i18n';
import EmbeddedFrontend from '@AC/EmbeddedFrontend';
import ImageUpload from '@AC/ImageUpload';
import PageLayout from '@AC/PageLayout';
import { TextField } from '@AC/ui/TextField';
import TitleDescription from '@Components/TitleDescription';
import useFaqsStore from '@DataStore/faqs/faqsStore';
import { useChatStore } from '@FDataStore/Chat/chatStore';

const QUESTION_MAX_LENGTH = 140;
const ANSWER_MAX_LENGTH = 600;

/**
 * Renders the FAQ creation or editing interface based on the presence of an ID.
 * If an ID is provided, the component loads the existing FAQ for editing; otherwise,
 * it initializes a form for creating a new FAQ.
 *
 * @param {Object} props - The component props.
 * @param {string | null} props.id - The ID of the FAQ to edit; if null, the component is in "create" mode.
 * @param {React.ReactNode} props.HeaderButtons - Optional header action buttons (e.g., Save, Cancel).
 * @param {React.ReactNode} props.HeaderButtonsLeft - Optional header action buttons to display on the left side.
 * @param {Object} [props.initialData] - Initial FAQ data for the form.
 * @param {Function} [props.onValidationChange] - Callback function when form validation state changes.
 *
 * @returns {JSX.Element} The rendered FaqCreateEdit component.
 */
const FaqCreateEdit = forwardRef(function FaqCreateEdit({
  id,
  HeaderButtons,
  HeaderButtonsLeft,
  initialData,
  onValidationChange,
}, ref) {
  const location = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(initialData?.question || '');
  const [currentAnswer, setCurrentAnswer] = useState(initialData?.answer || '');
  const [file, setFile] = useState(initialData?.image || null);
  const [isInitialized, setIsInitialized] = useState(false);

  const mode = location.pathname.includes('/create') ? 'create' : 'edit';
  const { loadFaq } = useFaqsStore();

  const setChatMessages = useChatStore((s) => s.setChatMessages);
  const setReplaceMode = useChatStore((s) => s.setReplaceMode);
  const setDisableFixed = useChatStore((s) => s.setDisableFixed);
  const setShowChat = useChatStore((s) => s.setShowChat);
  const setInitialRoute = useChatStore((s) => s.setInitialRoute);
  const setShowChatToggle = useChatStore((s) => s.setShowChatToggle);
  const setDisableNavigation = useChatStore((s) => s.setDisableNavigation);
  const setRootClassName = useChatStore((s) => s.setRootClassName);
  const setIsPreviewMode = useChatStore((s) => s.setIsPreviewMode);
  const reset = useChatStore((state) => state.reset);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getData: () => ({
      question: currentQuestion,
      answer: currentAnswer,
      image: file,
    }),
    isValid: () => {
      return currentQuestion.trim() !== '' && currentAnswer.trim() !== '';
    },
  }));

  // Load initial data
  useEffect(() => {
    if (!id || mode === 'create') {
      setIsInitialized(true);
      return;
    }

    async function fetchData() {
      try {
        const data = await loadFaq(id);
        setCurrentQuestion(data.question);
        setCurrentAnswer(data.answer);
        setFile(data.image);
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to load FAQ:', err);
        setIsInitialized(true);
      }
    }
    fetchData();
  }, [id, mode, loadFaq]);

 /** Initialize chat UI and FAQ preview */
  useEffect(() => {
    setInitialRoute('/chat');
    setDisableFixed(true);
    setShowChat(true);
    setShowChatToggle(false);
    setDisableNavigation(true);
    setRootClassName('wpchat:flex wpchat:justify-center');
    setIsPreviewMode(true); // Set preview mode to prevent analytics logging
    return () => reset();
  }, []);

  // Notify parent of validation state changes
  useEffect(() => {
    if (!isInitialized) return;

    const isValid = currentQuestion.trim() !== '' && currentAnswer.trim() !== '';
    onValidationChange?.(isValid);
  }, [currentQuestion, currentAnswer, isInitialized, onValidationChange]);

  // Update preview when inputs change
  useEffect(() => {
    if (!isInitialized) return;

    const userMsg = {
      message: currentQuestion || __('A preview of your question will appear here', 'smashballoon-wpchat-livechat-customer-support'),
      messageType: 'send',
      directAnswer: true,
    };

    const receivedMsg = {
      message:
        currentAnswer ||
        __(
          'The preview of the answer of your question will appear here once',
          'smashballoon-wpchat-livechat-customer-support',
        ),
      messageType: 'receive',
      images: file ? [file] : [],
      verifiedQuote: true,
    };

    setReplaceMode(true);
    setChatMessages(() => [userMsg, receivedMsg]);
  }, [currentQuestion, currentAnswer, file, isInitialized]);

  return (
    <PageLayout
      disableLogo={true}
      HeaderButtonsLeft={HeaderButtonsLeft}
      HeaderButtons={HeaderButtons && HeaderButtons}
      layoutClassName='wpchat:bg-white'
      className='wpchat:max-w-full wpchat:p-0 wpchat:md:p-0'
      disableHelpBtn={true}
      headerVariant='three'
    >
      <div className='wpchat:grid wpchat:md:grid-cols-2'>
        <div className='wpchat:px-4 wpchat:py-5 wpchat:md:px-10 wpchat:md:pt-8'>
          <TextField
            label={__('Question', 'smashballoon-wpchat-livechat-customer-support')}
            name='question'
            placeholder={__('Your question', 'smashballoon-wpchat-livechat-customer-support')}
            type='text'
            onChange={setCurrentQuestion}
            value={currentQuestion}
            maxLength={QUESTION_MAX_LENGTH}
            showMaxLength={true}
            inputClassName='wpchat:w-full wpchat:py-3 wpchat:text-base'
            className='wpchat:mb-4'
            as='input'
            isRequired
            helperText={`${currentQuestion.length}/${QUESTION_MAX_LENGTH}`}
          />
          <TextField
            label={__('Answer', 'smashballoon-wpchat-livechat-customer-support')}
            placeholder={__(
              'Add an answer to your question here',
              'smashballoon-wpchat-livechat-customer-support',
            )}
            name='answer'
            type='text'
            onChange={setCurrentAnswer}
            value={currentAnswer}
            maxLength={ANSWER_MAX_LENGTH}
            showMaxLength={true}
            inputClassName='wpchat:w-full wpchat:py-3 wpchat:text-base'
            as='textarea'
            isRequired
            helperText={`${currentAnswer.length}/${ANSWER_MAX_LENGTH}`}
          />
          <div>
            <h6 className='wpchat:mt-3.5 wpchat:mb-2'>
              {__('Image', 'smashballoon-wpchat-livechat-customer-support')}
            </h6>
            <ImageUpload
              onFileSelect={setFile}
              mode='preview'
              previewClassName='wpchat:mb-3.5'
              file={file}
            />
          </div>
        </div>
        <div className='wpchat:border wpchat:border-s wpchat:border-gray-200 wpchat:bg-gray-50 wpchat:md:sticky wpchat:md:top-[98px] wpchat:md:min-h-[calc(100vh-98px)] wpchat:md:overflow-auto'>
          <TitleDescription
            title={__('Preview', 'smashballoon-wpchat-livechat-customer-support')}
            description={__(
              'How your FAQ will look like in the chatbot',
              'smashballoon-wpchat-livechat-customer-support',
            )}
            className='wpchat:px-4 wpchat:py-5 wpchat:md:px-8 wpchat:md:pt-4'
            titleClassName='wpchat:text-lg'
            descriptionClassName='wpchat:text-gray-500 wpchat:mb-1'
          />
          <EmbeddedFrontend className='wpchat:ps-3' />
        </div>
      </div>
    </PageLayout>
  );
});

export default FaqCreateEdit;
