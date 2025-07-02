/**
 * Robust clipboard function that works in Figma plugins
 * @param text - The text to copy to clipboard
 * @returns Promise<void> - Throws error if copy fails
 */
export async function copyToClipboard(text: string): Promise<void> {
    try {
        // First try the modern Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }
    } catch {
        console.log('Modern clipboard API failed, trying fallback...');
    }

    // Fallback to the textarea/execCommand method
    try {
        const prevActive = document.activeElement;
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const success = document.execCommand('copy');
        textArea.remove();
        if (prevActive && 'focus' in prevActive)
            (prevActive as HTMLElement).focus();

        if (!success) {
            throw new Error('execCommand failed');
        }
    } catch (err) {
        console.error('All clipboard methods failed:', err);
        // Show an alert as last resort
        alert('Copy failed. Please manually copy the code from the console or UI below.');
        throw err;
    }
}
