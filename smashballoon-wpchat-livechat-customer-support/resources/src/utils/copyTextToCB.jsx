/**
 * Copies text to the clipboard using the Clipboard API,
 * with a fallback for older browsers.
 * @param {string} text - The text to copy.
 * @returns {Promise<boolean>} - Whether the copy was successful.
 */
export const copyTextToCB = async (text) => {
  try {
    if (typeof navigator.clipboard?.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
    throw new Error('Clipboard API not available or failed');
  } catch {
    const textarea = Object.assign(document.createElement('textarea'), {
      value: text,
      style: 'position:fixed;top:0;inset-inline-start:0;opacity:0;',
    });

    document.body.appendChild(textarea);
    textarea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textarea);

    return success;
  }
};
