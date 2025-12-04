const MAX_MESSAGE_BYTES = 4000;

interface BuildPayloadArgs {
  postId: string;
  postName: string;
  text?: string;
}

export interface ForwardPayload {
  message: string;
  bytes: number;
  link: string;
  snippet?: string;
}

const encoder = new TextEncoder();

function truncateToBytes(text: string, maxBytes: number): string {
  if (maxBytes <= 0) return '';
  let bytesUsed = 0;
  let result = '';
  for (const char of text) {
    const charBytes = encoder.encode(char).length;
    if (bytesUsed + charBytes > maxBytes) break;
    result += char;
    bytesUsed += charBytes;
  }
  return result.trim();
}

export function buildForwardPayload({
  postId,
  postName,
  text,
}: BuildPayloadArgs): ForwardPayload {
  const link = `qortal://APP/Quittest/post/${encodeURIComponent(postName)}/${encodeURIComponent(postId)}`;
  const cleanText = (text || '').replace(/\s+/g, ' ').trim();
  const baseLinkBytes = encoder.encode(link).length;

  // Reserve space for link plus spacing
  const spacer = cleanText ? '\n\n' : '';
  const spacerBytes = cleanText ? encoder.encode(spacer).length : 0;

  let snippet = '';
  if (cleanText) {
    // Try a 200-char snippet, then trim by bytes if needed
    const targetSnippet = cleanText.slice(0, 200);
    const snippetBytes = encoder.encode(targetSnippet).length;
    const available = MAX_MESSAGE_BYTES - baseLinkBytes - spacerBytes;
    snippet = snippetBytes > available ? truncateToBytes(cleanText, available) : targetSnippet;
  }

  let message = cleanText ? `${snippet}${spacer}${link}`.trim() : link;
  let bytes = encoder.encode(message).length;

  // If still too large (e.g., very long link), force truncate text portion further
  if (bytes > MAX_MESSAGE_BYTES && snippet) {
    const available = MAX_MESSAGE_BYTES - baseLinkBytes - spacerBytes;
    const trimmedSnippet = truncateToBytes(snippet, available);
    message = trimmedSnippet ? `${trimmedSnippet}${spacer}${link}` : link;
    bytes = encoder.encode(message).length;
  }

  return { message, bytes, link, snippet: snippet || undefined };
}
