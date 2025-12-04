import {
  Avatar,
  IconButton,
  Box,
  useTheme,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import { styled } from '@mui/system';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useRef, useEffect, lazy, Suspense, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { EmojiClickData, EmojiStyle, Theme } from 'emoji-picker-react';
import { VideoMetadata as VideoMetadataType } from './VideoMetadataDialog';
import { useVideoMetadata } from '../hooks/useVideoMetadata';
import { MediaAttachment, buildHashtagDescription } from '../utils/postQdn';
import { useMediaInfo } from '../hooks/useMediaInfo';
import { showError } from 'qapp-core';

// Lazy load heavy components
const EmojiPicker = lazy(() =>
  import('emoji-picker-react').then((module) => ({
    default: module.default,
  }))
);

const VideoMetadataDialog = lazy(() =>
  import('./VideoMetadataDialog').then((module) => ({
    default: module.VideoMetadataDialog,
  }))
);

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  transition: 'transform 0.2s ease',
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 2px 8px rgba(0, 0, 0, 0.3)'
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
  '&:hover': {
    transform: 'scale(1.05) rotate(5deg)',
  },
}));

export interface PostContent {
  text: string;
  media: MediaAttachment[];
}

const NewPostContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(2.5),
  margin: theme.spacing(2, 1.5, 1.5, 1.5),
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  gap: theme.spacing(1.5),
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 2px 8px rgba(0, 0, 0, 0.3)'
      : '0 2px 8px rgba(0, 0, 0, 0.06)',
  transition: 'all 0.3s ease',
  '&:focus-within': {
    borderColor: theme.palette.primary.main,
    boxShadow:
      theme.palette.mode === 'dark'
        ? `0 0 0 3px rgba(29, 155, 240, 0.2), 0 4px 12px rgba(0, 0, 0, 0.4)`
        : `0 0 0 3px rgba(29, 155, 240, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)`,
    transform: 'translateY(-2px)',
  },
}));

const InputSection = styled('div')({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

const ActionsBar = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: theme.spacing(1.5),
  borderTop: `1px solid ${theme.palette.divider}`,
  marginTop: theme.spacing(1),
}));

const MediaActions = styled('div')({
  display: 'flex',
  gap: '8px',
  '& button': {
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.1) rotate(5deg)',
    },
  },
});

const PostButton = styled('button')<{ disabled?: boolean }>(
  ({ theme, disabled }) => ({
    background: disabled
      ? theme.palette.mode === 'dark'
        ? 'rgba(29, 155, 240, 0.3)'
        : 'rgba(29, 155, 240, 0.5)'
      : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
    color: '#fff',
    border: 'none',
    borderRadius: '24px',
    padding: '10px 24px',
    fontWeight: 700,
    fontSize: '15px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: disabled
      ? 'none'
      : theme.palette.mode === 'dark'
        ? '0 4px 12px rgba(29, 155, 240, 0.3)'
        : '0 4px 12px rgba(29, 155, 240, 0.25)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background:
        'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
      transition: 'left 0.5s',
    },
    '&:hover': {
      transform: disabled ? 'none' : 'translateY(-2px) scale(1.02)',
      boxShadow: disabled
        ? 'none'
        : theme.palette.mode === 'dark'
          ? '0 6px 20px rgba(29, 155, 240, 0.4)'
          : '0 6px 20px rgba(29, 155, 240, 0.35)',
      '&::before': {
        left: disabled ? '-100%' : '100%',
      },
    },
    '&:active': {
      transform: disabled ? 'none' : 'translateY(0) scale(0.98)',
    },
  })
);

const MediaPreviewContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  flexWrap: 'wrap',
  marginTop: theme.spacing(1),
}));

const MediaPreviewItem = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  width: '200px',
  height: '200px',
  border: `2px solid ${theme.palette.divider}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 4px 12px rgba(0, 0, 0, 0.3)'
      : '0 4px 12px rgba(0, 0, 0, 0.08)',
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'scale(1.02)',
    borderColor: theme.palette.primary.main,
  },
}));

const VideoMetadataOverlay = styled('div')(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent)',
  padding: theme.spacing(1.5, 1),
  color: '#fff',
  fontSize: '12px',
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
}));

const MediaPreview = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

const VideoPreview = styled('video')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

const RemoveMediaButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(0.5),
  right: theme.spacing(0.5),
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  color: '#fff',
  padding: '6px',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    transform: 'scale(1.1) rotate(90deg)',
  },
}));

const EmojiPickerContainer = styled('div')(({ theme }) => ({
  position: 'fixed',
  zIndex: 9999,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 8px 32px rgba(0, 0, 0, 0.6)'
      : '0 8px 32px rgba(0, 0, 0, 0.15)',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
}));

const TextFieldWrapper = styled('div')({
  position: 'relative',
  width: '100%',
});

const StyledContentEditable = styled('div')(({ theme }) => ({
  fontSize: '20px',
  lineHeight: '1.4375em',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  minHeight: '48px', // Match TextField minRows={2}
  padding: '16.5px 0',
  outline: 'none',
  color: theme.palette.text.primary,
  fontFamily: 'inherit',
  '&:empty:before': {
    content: 'attr(data-placeholder)',
    color: theme.palette.text.secondary,
    opacity: 0.6,
    pointerEvents: 'none',
  },
  '&:focus:empty:before': {
    opacity: 0.4,
  },
  '& .hashtag': {
    color: theme.palette.primary.main,
    fontWeight: 700,
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(29, 155, 240, 0.2)'
        : 'rgba(29, 155, 240, 0.15)',
    borderRadius: '4px',
    padding: '2px 4px',
  },
  '& .mention': {
    color: theme.palette.primary.main,
    fontWeight: 700,
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(29, 155, 240, 0.2)'
        : 'rgba(29, 155, 240, 0.15)',
    borderRadius: '4px',
    padding: '2px 4px',
  },
}));

const MentionPopover = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  zIndex: 1000,
  minWidth: '200px',
  maxWidth: '300px',
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 8px 32px rgba(0, 0, 0, 0.6)'
      : '0 8px 32px rgba(0, 0, 0, 0.15)',
  borderRadius: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '300px',
}));

interface NewPostInputProps {
  onPost?: (content: PostContent) => void | Promise<void>;
  placeholder?: string;
  userAvatar?: string;
  userName?: string;
  isPublishing?: boolean;
  initialText?: string;
  initialMedia?: MediaAttachment[];
  isEditing?: boolean;
  showAuthHint?: boolean;
}

// Helper function to get file extension
const getFileExtension = (file: File): string => {
  const fileName = file.name;
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.substring(lastDot + 1).toLowerCase();
};

export function NewPostInput({
  onPost = () => {},
  placeholder = "What's happening?",
  userAvatar,
  userName = 'User',
  isPublishing = false,
  initialText = '',
  initialMedia = [],
  isEditing = false,
  showAuthHint = false,
}: NewPostInputProps) {
  const theme = useTheme();
  const { isHEVC } = useMediaInfo();
  const [text, setText] = useState(initialText);
  const [media, setMedia] = useState<MediaAttachment[]>(initialMedia);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [pendingVideo, setPendingVideo] = useState<{
    file: File;
    preview: string;
  } | null>(null);
  const [showVideoMetadataDialog, setShowVideoMetadataDialog] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const mentionPopoverRef = useRef<HTMLDivElement>(null);
  const mentionSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const mentionSearchInputRef = useRef<HTMLInputElement>(null);
  const mentionPopoverPositionSetRef = useRef(false);

  // Mention autocomplete state
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [mentionPopoverPosition, setMentionPopoverPosition] = useState({
    top: 0,
    left: 0,
  });
  const [mentionSuggestions, setMentionSuggestions] = useState<string[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [isMentionSearching, setIsMentionSearching] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');

  // Fetch metadata for existing videos
  const existingVideoRefs = media
    .filter((m) => m.type === 'video' && m.existingVideo)
    .map((m) => m.existingVideo!);
  const { videosWithMetadata } = useVideoMetadata(
    existingVideoRefs.length > 0 ? existingVideoRefs : undefined
  );
  const hashtagStatus = useMemo(() => {
    const matches = text.match(/#\w+/g) || [];
    if (!matches.length) {
      return { truncated: false };
    }
    const { truncated } = buildHashtagDescription(matches);
    return { truncated };
  }, [text]);

  // Initialize text and media once when entering edit mode
  useEffect(() => {
    if (isEditing && !hasInitialized) {
      setText(initialText);
      setMedia(initialMedia);
      setHasInitialized(true);
    }
    // Reset initialization flag when not editing
    if (!isEditing && hasInitialized) {
      setHasInitialized(false);
    }
  }, [isEditing, hasInitialized, initialText, initialMedia]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Close mention popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mentionPopoverRef.current &&
        !mentionPopoverRef.current.contains(event.target as Node) &&
        contentEditableRef.current &&
        !contentEditableRef.current.contains(event.target as Node)
      ) {
        setShowMentionPopover(false);
        setMentionSearchQuery('');
        mentionPopoverPositionSetRef.current = false;
      }
    };

    if (showMentionPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMentionPopover]);

  // Cleanup mention search timeout on unmount
  useEffect(() => {
    return () => {
      if (mentionSearchTimeoutRef.current) {
        clearTimeout(mentionSearchTimeoutRef.current);
      }
    };
  }, []);

  const handlePost = async () => {
    if (text.trim() || media.length > 0) {
      try {
        await onPost({ text, media });
        // Clear the form only after successful post
        setText('');
        setMedia([]);
      } catch (error) {
        // Don't clear fields if there's an error
        console.error('Error posting:', error);
      }
    }
  };

  // Function to search for users by name
  const searchMentionUsers = (
    searchTerm: string,
    showLoader: boolean = true
  ) => {
    // Clear any existing search timeout
    if (mentionSearchTimeoutRef.current) {
      clearTimeout(mentionSearchTimeoutRef.current);
    }

    if (!searchTerm) {
      setMentionSuggestions([]);
      setIsMentionSearching(false);
      return;
    }

    // Show loader immediately if requested
    if (showLoader) {
      setIsMentionSearching(true);
    }

    // Use setTimeout for debouncing the actual API call
    mentionSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await qortalRequest({
          action: 'SEARCH_NAMES',
          query: searchTerm,
          limit: 10,
          prefix: true,
        });

        const users: string[] = [];
        if (response && Array.isArray(response)) {
          response.forEach((nameData: any) => {
            const name = nameData.name || nameData;
            if (name) {
              users.push(name);
            }
          });
        }

        setMentionSuggestions(users);
        setSelectedMentionIndex(0);
        setIsMentionSearching(false);
      } catch (error) {
        console.error('Error searching users:', error);
        setIsMentionSearching(false);
      }
    }, 500); // 500ms debounce
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Count current images
    const currentImageCount = media.filter((m) => m.type === 'image').length;
    const remainingSlots = 2 - currentImageCount;

    if (remainingSlots <= 0) {
      alert('Maximum 2 images allowed per post');
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
      return;
    }

    const newMedia: MediaAttachment[] = [];
    let addedCount = 0;
    let rejectedGifs = 0;

    Array.from(files).forEach((file) => {
      // Reject GIF files
      if (file.type === 'image/gif') {
        rejectedGifs++;
        return;
      }

      if (file.type.startsWith('image/') && addedCount < remainingSlots) {
        const preview = URL.createObjectURL(file);
        newMedia.push({ type: 'image', file, preview });
        addedCount++;
      }
    });

    if (rejectedGifs > 0) {
      alert(
        'GIF images are not supported. Please use JPEG, PNG, or WebP format.'
      );
    } else if (addedCount < files.length) {
      alert(
        `Only ${remainingSlots} more image(s) can be added. Maximum is 2 images per post.`
      );
    }

    setMedia([...media, ...newMedia]);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleVideoSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if there's already a video
    const hasVideo = media.some((m) => m.type === 'video');
    if (hasVideo) {
      alert('Only one video is allowed per post');
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
      return;
    }

    // Only take the first video file
    const file = Array.from(files).find((f) => f.type.startsWith('video/'));
    if (!file) {
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
      return;
    }

    // Validate video file for unsupported formats
    const notSupportedCodec = await isHEVC(file);
    const isMKV = getFileExtension(file) === 'mkv';
    const isUnsupportedFile = notSupportedCodec || isMKV;

    if (isUnsupportedFile) {
      if (notSupportedCodec) {
        showError(`${file.name} uses the unsupported encoding: HEVC`);
      }
      if (isMKV) {
        showError(`${file.name} uses the unsupported file container: MKV`);
      }

      // Reset the input
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
      return;
    }

    // Create preview and open metadata dialog
    const preview = URL.createObjectURL(file);
    setPendingVideo({ file, preview });
    setShowVideoMetadataDialog(true);

    // Reset the input
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleVideoMetadataConfirm = (metadata: VideoMetadataType) => {
    if (pendingVideo) {
      const newVideoAttachment: MediaAttachment = {
        type: 'video',
        file: pendingVideo.file,
        preview: pendingVideo.preview,
        videoMetadata: metadata,
      };
      setMedia([...media, newVideoAttachment]);
    }
    setShowVideoMetadataDialog(false);
    setPendingVideo(null);
  };

  const handleVideoMetadataCancel = () => {
    // Clean up the preview URL
    if (pendingVideo) {
      URL.revokeObjectURL(pendingVideo.preview);
    }
    setShowVideoMetadataDialog(false);
    setPendingVideo(null);
  };

  const handleRemoveMedia = (index: number) => {
    const mediaItem = media[index];

    // If removing a video during editing, show a confirmation with info about Q-Tube
    if (mediaItem.type === 'video' && isEditing) {
      const confirmed = window.confirm(
        'Remove this video from the post?\n\n' +
          'Note: This only removes the video reference from the post. ' +
          'To delete the actual video file, please use the Q-Tube app.'
      );

      if (!confirmed) {
        return;
      }
    }

    const newMedia = [...media];
    URL.revokeObjectURL(newMedia[index].preview);
    newMedia.splice(index, 1);
    setMedia(newMedia);
  };

  // Format text with hashtag and mention styling
  const formatTextWithHashtags = (plainText: string): string => {
    // Escape HTML first
    const escaped = plainText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Apply formatting for hashtags and mentions
    // Only match @ and # when preceded by whitespace or at start of text
    // Matches: #hashtag (with word boundary), @username, @{username with spaces}
    return escaped.replace(
      /(^|[\s])(@\{[^}]+\}|@[a-zA-Z0-9_-]+|#\w+)/g,
      (match, prefix, tag) => {
        if (tag.startsWith('#')) {
          return `${prefix}<span class="hashtag">${tag}</span>`;
        } else if (tag.startsWith('@')) {
          return `${prefix}<span class="mention">${tag}</span>`;
        }
        return match;
      }
    );
  };

  // Extract plain text from HTML
  const extractPlainText = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  // Calculate cursor position in plain text
  const getCursorPosition = (element: HTMLElement, range: Range): number => {
    let position = 0;
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while ((node = walker.nextNode())) {
      if (node === range.startContainer) {
        position += range.startOffset;
        return position;
      }
      position += node.textContent?.length || 0;
    }

    // If not found, return the total length
    return extractPlainText(element.innerHTML).length;
  };

  // Set cursor position in formatted HTML
  const setCursorPosition = (element: HTMLElement, position: number) => {
    const selection = window.getSelection();
    if (!selection) return;

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentPos = 0;
    let targetNode: Node | null = null;
    let targetOffset = 0;

    let node;
    while ((node = walker.nextNode())) {
      const nodeLength = node.textContent?.length || 0;
      if (currentPos + nodeLength >= position) {
        targetNode = node;
        targetOffset = position - currentPos;
        break;
      }
      currentPos += nodeLength;
    }

    if (targetNode) {
      const range = document.createRange();
      range.setStart(
        targetNode,
        Math.min(targetOffset, targetNode.textContent?.length || 0)
      );
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Fallback: set cursor to end
      const endRange = document.createRange();
      endRange.selectNodeContents(element);
      endRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(endRange);
    }
  };

  // Handle contentEditable input
  const handleContentEditableInput = () => {
    if (contentEditableRef.current) {
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

      // Calculate cursor position in plain text BEFORE reformatting
      const cursorPosition = range
        ? getCursorPosition(contentEditableRef.current, range)
        : extractPlainText(contentEditableRef.current.innerHTML).length;

      const plainText = extractPlainText(contentEditableRef.current.innerHTML);
      setText(plainText);

      // Check for @ mention to show autocomplete
      const textBeforeCursor = plainText.substring(0, cursorPosition);
      // Match @ preceded by start of string or whitespace, followed by any alphanumeric/hyphen/underscore characters
      // This ensures there's no character right behind the @
      const mentionMatch = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_-]*)$/);

      if (mentionMatch) {
        const searchTerm = mentionMatch[1];

        // Don't show popover if user typed a space after @ (search term would be empty and they hit space)
        // Check if the last character before cursor is a space after @
        if (searchTerm === '' && textBeforeCursor.endsWith('@ ')) {
          setShowMentionPopover(false);
          mentionPopoverPositionSetRef.current = false;
        } else if (searchTerm.length > 0) {
          // Only calculate position once when first opening the popover
          // This prevents the popover from moving as the user types
          if (!mentionPopoverPositionSetRef.current && range) {
            const rect = range.getBoundingClientRect();
            const popoverPos = {
              top: rect.bottom + window.scrollY + 5,
              left: rect.left + window.scrollX,
            };
            setMentionPopoverPosition(popoverPos);
            mentionPopoverPositionSetRef.current = true;
          }

          // Show popover and set initial search query
          setShowMentionPopover(true);
          setMentionSearchQuery(searchTerm);

          // Show loader immediately while we wait for debounced search
          setIsMentionSearching(true);

          // Search for users using the search function
          searchMentionUsers(searchTerm, false);
        } else {
          // If searchTerm is empty (just typed @), don't show popover yet
          setShowMentionPopover(false);
          mentionPopoverPositionSetRef.current = false;
        }
      } else {
        setShowMentionPopover(false);
        setMentionSearchQuery('');
        mentionPopoverPositionSetRef.current = false;
      }

      // Re-format with hashtags and mentions, then restore cursor
      requestAnimationFrame(() => {
        if (contentEditableRef.current) {
          contentEditableRef.current.innerHTML =
            formatTextWithHashtags(plainText);

          // Restore cursor position
          setCursorPosition(contentEditableRef.current, cursorPosition);
        }
      });
    }
  };

  // Update contentEditable when text changes externally (e.g., from emoji picker)
  useEffect(() => {
    if (contentEditableRef.current) {
      const currentPlainText = extractPlainText(
        contentEditableRef.current.innerHTML
      );
      if (currentPlainText !== text) {
        const wasFocused =
          document.activeElement === contentEditableRef.current;
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

        // Calculate cursor position before updating
        const cursorPosition =
          range && wasFocused
            ? getCursorPosition(contentEditableRef.current, range)
            : text.length;

        contentEditableRef.current.innerHTML = formatTextWithHashtags(text);

        // Restore focus and cursor if it was focused
        if (wasFocused) {
          contentEditableRef.current.focus();
          setCursorPosition(contentEditableRef.current, cursorPosition);
        }
      }
    }
  }, [text]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (contentEditableRef.current) {
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

      if (range) {
        range.deleteContents();
        const textNode = document.createTextNode(emojiData.emoji);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }

      handleContentEditableInput();
    }
    setShowEmojiPicker(false);
  };

  return (
    <>
      <NewPostContainer>
        <StyledAvatar src={userAvatar} alt={userName}>
          {userName[0]}
        </StyledAvatar>
        <InputSection>
          <Box sx={{ display: 'flex', flexDirection: 'column', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              @{userName}
            </Typography>
            {showAuthHint && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ opacity: 0.8 }}
              >
                You’ll be prompted to authenticate before posting.
              </Typography>
            )}
          </Box>
          <TextFieldWrapper>
            <StyledContentEditable
              ref={contentEditableRef}
              contentEditable
              data-placeholder={placeholder}
              onInput={handleContentEditableInput}
              onKeyDown={handleKeyDown}
              onPaste={(e) => {
                // Check if there are any image files in the clipboard
                const clipboardItems = e.clipboardData.items;
                let hasImageFile = false;

                for (let i = 0; i < clipboardItems.length; i++) {
                  const item = clipboardItems[i];
                  if (item.type.startsWith('image/')) {
                    hasImageFile = true;
                    const file = item.getAsFile();

                    if (file) {
                      // Reject GIF files
                      if (file.type === 'image/gif') {
                        e.preventDefault();
                        alert(
                          'GIF images are not supported. Please use JPEG, PNG, or WebP format.'
                        );
                        return;
                      }

                      // Count current images
                      const currentImageCount = media.filter(
                        (m) => m.type === 'image'
                      ).length;
                      const remainingSlots = 2 - currentImageCount;

                      if (remainingSlots <= 0) {
                        e.preventDefault();
                        alert('Maximum 2 images allowed per post');
                        return;
                      }

                      // Add the pasted image
                      const preview = URL.createObjectURL(file);
                      const newMedia: MediaAttachment = {
                        type: 'image',
                        file,
                        preview,
                      };
                      setMedia([...media, newMedia]);
                    }

                    // Prevent default paste behavior for images
                    e.preventDefault();
                    return;
                  }
                }

                // Handle text paste normally if no images
                if (!hasImageFile) {
                  e.preventDefault();
                  const plainText = e.clipboardData.getData('text/plain');
                  const selection = window.getSelection();
                  if (selection?.rangeCount) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    const textNode = document.createTextNode(plainText);
                    range.insertNode(textNode);
                    range.setStartAfter(textNode);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                  }
                  handleContentEditableInput();
                }
              }}
              suppressContentEditableWarning
            />
          </TextFieldWrapper>

          {media.length > 0 && (
            <MediaPreviewContainer>
              {media.map((item, index) => {
                // For existing videos, find the metadata
                const existingVideoMetadata =
                  item.type === 'video' && item.existingVideo
                    ? videosWithMetadata.find(
                        (v) =>
                          v.metadataIdentifier ===
                          item.existingVideo!.identifier
                      )
                    : null;

                return (
                  <MediaPreviewItem key={index}>
                    {item.type === 'image' ? (
                      <MediaPreview src={item.preview} alt="Preview" />
                    ) : item.existingVideo && existingVideoMetadata ? (
                      // Existing video from editing
                      <>
                        <MediaPreview
                          src={
                            existingVideoMetadata.metadata.videoImage ||
                            '/default-video-thumb.png'
                          }
                          alt="Video Preview"
                        />
                        <VideoMetadataOverlay>
                          {existingVideoMetadata.metadata.title}
                        </VideoMetadataOverlay>
                      </>
                    ) : (
                      // New video upload
                      <>
                        <VideoPreview src={item.preview} controls />
                        {item.videoMetadata && (
                          <VideoMetadataOverlay>
                            {item.videoMetadata.title}
                          </VideoMetadataOverlay>
                        )}
                      </>
                    )}
                    <RemoveMediaButton
                      size="small"
                      onClick={() => handleRemoveMedia(index)}
                    >
                      <CloseIcon fontSize="small" />
                    </RemoveMediaButton>
                  </MediaPreviewItem>
                );
              })}
            </MediaPreviewContainer>
          )}

          <ActionsBar>
            <MediaActions>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                style={{ display: 'none' }}
                onChange={handleImageSelect}
              />
              <IconButton
                size="small"
                color="primary"
                onClick={() => imageInputRef.current?.click()}
                title="Add images"
              >
                <ImageIcon />
              </IconButton>

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={handleVideoSelect}
              />
              <IconButton
                size="small"
                color="primary"
                onClick={() => videoInputRef.current?.click()}
                title={
                  media.some((m) => m.type === 'video')
                    ? 'Only one video per post'
                    : 'Add video'
                }
                disabled={media.some((m) => m.type === 'video')}
                sx={{
                  '&.Mui-disabled': {
                    opacity: 0.4,
                    cursor: 'not-allowed',
                  },
                }}
              >
                <VideoLibraryIcon />
              </IconButton>

              <IconButton
                size="small"
                color="primary"
                onClick={() => {
                  // Focus on the input before opening emoji picker
                  if (
                    contentEditableRef.current &&
                    document.activeElement !== contentEditableRef.current
                  ) {
                    contentEditableRef.current.focus();
                  }
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                title="Add emoji"
              >
                <EmojiEmotionsIcon />
              </IconButton>
            </MediaActions>
            {hashtagStatus.truncated && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ flex: 1, textAlign: 'right', pr: 2 }}
              >
                Hashtags will be trimmed to fit the limit.
              </Typography>
            )}
            <PostButton
              disabled={(!text.trim() && media.length === 0) || isPublishing}
              onClick={handlePost}
            >
              {isPublishing ? 'Publishing...' : 'Post'}
            </PostButton>
          </ActionsBar>
        </InputSection>
      </NewPostContainer>

      {showEmojiPicker &&
        createPortal(
          <>
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 9998,
              }}
              onClick={() => setShowEmojiPicker(false)}
            />
            <EmojiPickerContainer ref={emojiPickerRef}>
              <Suspense
                fallback={
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: 400,
                      width: 350,
                    }}
                  >
                    <CircularProgress />
                  </Box>
                }
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  autoFocusSearch={false}
                  emojiStyle={EmojiStyle.NATIVE}
                  theme={
                    theme.palette.mode === 'dark' ? Theme.DARK : Theme.LIGHT
                  }
                  height={400}
                  width={350}
                  lazyLoadEmojis={true}
                />
              </Suspense>
            </EmojiPickerContainer>
          </>,
          document.body
        )}

      {showVideoMetadataDialog && (
        <Suspense fallback={<CircularProgress />}>
          <VideoMetadataDialog
            open={showVideoMetadataDialog}
            videoFile={pendingVideo?.file || null}
            videoPreview={pendingVideo?.preview || null}
            onConfirm={handleVideoMetadataConfirm}
            onCancel={handleVideoMetadataCancel}
          />
        </Suspense>
      )}

      {showMentionPopover &&
        createPortal(
          <MentionPopover
            ref={mentionPopoverRef}
            sx={{
              position: 'fixed',
              top: `${mentionPopoverPosition.top}px`,
              left: `${mentionPopoverPosition.left}px`,
            }}
          >
            {/* Search input at the top - fixed, not scrollable */}
            <Box
              sx={{
                padding: 1,
                borderBottom: 1,
                borderColor: 'divider',
                flexShrink: 0,
              }}
            >
              <TextField
                inputRef={mentionSearchInputRef}
                size="small"
                fullWidth
                placeholder="Search users..."
                value={mentionSearchQuery}
                onChange={handleMentionSearchChange}
                autoComplete="off"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '14px',
                  },
                }}
              />
            </Box>

            {/* Results list - scrollable area */}
            <Box sx={{ overflowY: 'auto', flexGrow: 1, minHeight: 0 }}>
              {isMentionSearching ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 2,
                  }}
                >
                  <CircularProgress size={20} />
                </Box>
              ) : mentionSuggestions.length > 0 ? (
                <List dense sx={{ padding: 0 }}>
                  {mentionSuggestions.map((name, index) => (
                    <ListItem key={name} disablePadding>
                      <ListItemButton
                        selected={index === selectedMentionIndex}
                        onClick={() => handleMentionSelect(name)}
                        sx={{
                          '&.Mui-selected': {
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            '&:hover': {
                              backgroundColor: theme.palette.primary.dark,
                            },
                          },
                        }}
                      >
                        <ListItemText primary={`@${name}`} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box
                  sx={{ padding: 2, color: 'text.secondary', fontSize: '14px' }}
                >
                  {mentionSearchQuery
                    ? 'No users found'
                    : 'Type to search users'}
                </Box>
              )}
            </Box>
          </MentionPopover>,
          document.body
        )}
    </>
  );
}
// Declare qortalRequest as a global function (provided by Qortal runtime)
declare global {
  function qortalRequest(params: any): Promise<any>;
}
