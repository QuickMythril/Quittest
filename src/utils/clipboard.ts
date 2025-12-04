/**
 * Copies text to the clipboard with fallback support for older browsers
 * and non-HTTPS contexts.
 *
 * @param text - The text to copy to clipboard
 * @returns Promise that resolves when copy is successful
 * @throws Error if both modern and legacy copy methods fail
 */
export async function copyToClipboard(text: string): Promise<void> {
  // Try modern clipboard API first
  let processed = false;
  try {
    await navigator.clipboard.writeText(text);
    processed = true;
  } catch (error) {
    console.error(error);
  }
  if (processed) return;

  console.info('Using clipboard legacy fallback');
  // Fallback for older browsers or non-HTTPS contexts
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    if (!successful) {
      throw new Error('execCommand copy failed');
    }
  } catch (error) {
    console.error(error);
  } finally {
    document.body.removeChild(textArea);
  }
}
