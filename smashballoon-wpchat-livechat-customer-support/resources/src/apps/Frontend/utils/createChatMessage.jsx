/**
 * Creates a chat message object with optional interactive options, images, and verification flag.
 *
 * @function
 * @param {string} message - The content of the chat message.
 * @param {Array<Object>} [options=[]] - An array of options for the user to select (e.g., buttons or links).
 * @param {string} [messageType='receive'] - The type of message ('receive' or 'send').
 * @param {boolean} [directAnswer=false] - Indicates if the message is a direct answer (e.g., a response to a question).
 * @param {Array<Object>} [images=[]] - An array of image objects, each with `imageName` and `altText` properties.
 * @param {boolean} [verifiedQuote=false] - Indicates if the message includes a verified quote (e.g., from a trusted source).
 *
 * @returns {Object|null} A chat message object or null if message is not valid.
 */
export const createChatMessage = (
  message,
  options = [],
  messageType = 'receive',
  directAnswer = false,
  images = [],
  verifiedQuote = false,
) => {
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return null;
  }

  return {
    message,
    optionsList: options.map(
      ({ label, response, nextOptions, images = [], verifiedQuote = false, onClick }) => ({
        label,
        onClick: () => {
          const chatMessage = createChatMessage(
            response,
            nextOptions || [],
            messageType,
            directAnswer,
            images,
            verifiedQuote,
          );
          onClick?.();
          return chatMessage;
        },
      }),
    ),
    messageType,
    directAnswer,
    images,
    verifiedQuote,
  };
};
