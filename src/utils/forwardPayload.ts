const MAX_MESSAGE_BYTES = 4000;

interface BuildPayloadArgs {
  postId: string;
  postName: string;
  text?: string;
  author?: string;
  created?: number;
  hasImages?: boolean;
  hasVideos?: boolean;
}

export interface ForwardPayload {
  message?: string;
  fullMessageObject?: any;
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

function timeAgo(from?: number): string {
  if (!from) return '';
  const diff = Date.now() - from;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function buildForwardPayload({
  postId,
  postName,
  text,
  author,
  created,
  hasImages,
  hasVideos,
}: BuildPayloadArgs): ForwardPayload {
  const link = `qortal://APP/Quittest/post/${encodeURIComponent(postName)}/${encodeURIComponent(postId)}`;
  const authorFromLink = decodeURIComponent(link.split('/')[5] || postName || 'Unknown');
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

  // Build tiptap document
  const ago = timeAgo(created);
  const headerParts = [
    { type: 'text', text: 'Posted by ' },
    {
      type: 'text',
      text: author || authorFromLink || 'Unknown',
      marks: [{ type: 'bold' }],
    },
    ...(ago ? [{ type: 'text', text: ` – ${ago}` }] : []),
  ];

  const buildQuoteNode = (value: string) => {
    const parts = value.split('\n');
    const content: any[] = [];
    parts.forEach((line, idx) => {
      if (line.length) {
        content.push({ type: 'text', text: line });
      }
      if (idx < parts.length - 1) {
        content.push({ type: 'hardBreak' });
      }
      if (!line.length && idx === parts.length - 1) {
        content.push({ type: 'text', text: ' ' });
      }
    });
    return {
      type: 'blockquote',
      content: [
        {
          type: 'paragraph',
          content,
        },
      ],
    };
  };

  const mediaMarkers = [];
  if (hasImages) mediaMarkers.push('[IMAGE]');
  if (hasVideos) mediaMarkers.push('[VIDEO]');
  const combinedText =
    [text || '', mediaMarkers.join(' ')].filter(Boolean).join('\n').trim();

  const blockquoteNode =
    combinedText && combinedText.length ? buildQuoteNode(combinedText) : null;

  const doc = {
    type: 'doc',
    content: [
      headerParts.length
        ? {
            type: 'paragraph',
            content: headerParts,
          }
        : undefined,
      blockquoteNode || undefined,
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Shared from Quittest',
            marks: [{ type: 'italic' }],
          },
        ],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: link }],
      },
    ].filter(Boolean),
  };

  let fullMessageObject: any = {
    messageText: doc,
    images: [],
    repliedTo: '',
    version: 3,
  };
  let bytes = encoder.encode(JSON.stringify(fullMessageObject)).length;

  // If too big, truncate text content inside the blockquote paragraphs
  if (bytes > MAX_MESSAGE_BYTES && blockquoteNode) {
    const available = MAX_MESSAGE_BYTES - (bytes - encoder.encode(text || '').length) - 50; // leave buffer
    const truncated = truncateToBytes(text || '', Math.max(available, 0));
    const truncatedNode =
      truncated && truncated.length ? buildQuoteNode(truncated) : null;

    const newDoc = {
      ...doc,
      content: (doc.content || []).map((node: any) =>
        node?.type === 'blockquote'
          ? truncatedNode
          : node
      ).filter(Boolean),
    };
    fullMessageObject = {
      ...fullMessageObject,
      messageText: newDoc,
    };
    bytes = encoder.encode(JSON.stringify(fullMessageObject)).length;
  }

  // If still too big, fall back to link-only string message
  if (bytes > MAX_MESSAGE_BYTES) {
    return { message: link, bytes: encoder.encode(link).length, link };
  }

  return { fullMessageObject, bytes, link, snippet: snippet || undefined };
}
