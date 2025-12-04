import {
  objectToBase64,
  EnumCollisionStrength,
  QortalMetadata,
} from 'qapp-core';
import {
  ENTITY_POST,
  ENTITY_ROOT,
  ENTITY_REPLY,
  ENTITY_REPOST,
  LIST_POSTS_FEED,
  QTUBE_VIDEO_BASE,
} from '../constants/qdn';
import { PostData } from '../components/Post';
import Compressor from 'compressorjs';
import ShortUniqueId from 'short-unique-id';

// Declare qortalRequest as a global function (provided by Qortal runtime)
declare global {
  function qortalRequest(params: any): Promise<any>;
}

// Initialize ShortUniqueId instances
const uid = new ShortUniqueId({ length: 8 }); // For video IDs
const shortuid = new ShortUniqueId({ length: 5 }); // For video codes

/**
 * Strip HTML tags from a string to get plain text
 */
function stripHtmlTags(html: string): string {
  if (!html) return '';
  // Create a temporary div element to leverage browser's HTML parsing
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

export interface VideoMetadata {
  title: string;
  description: string;
  duration?: number;
  videoImage?: string; // Compressed base64 image
  extracts?: string[]; // 4 compressed base64 images
  category: number; // Required
  subcategory?: number;
}

export interface VideoMetadataDocument {
  title: string;
  version: number;
  fullDescription: string;
  htmlDescription: string;
  videoImage?: string; // base64 encoded thumbnail
  videoReference: {
    name: string;
    identifier: string;
    service: string;
  };
  extracts?: string[]; // Additional thumbnails/previews as base64
  commentsId?: string;
  category: number; // Required
  subcategory?: number;
  code?: string;
  videoType: string;
  filename: string;
  fileSize: number;
  duration: number;
}

export interface MediaAttachment {
  type: 'image' | 'video';
  file: File;
  preview: string;
  videoMetadata?: VideoMetadata;
  // For existing videos when editing (not new uploads)
  existingVideo?: {
    identifier: string;
    name: string;
    service: string;
  };
}

export interface PostLocation {
  name: string;
  identifier: string;
  service: string;
}

export interface RepostMetadata {
  originalPostName: string;
  originalPostIdentifier: string;
  originalPostService: string;
}

export interface PostImage {
  src: string; // Base64 encoded image
}

export interface PostVideo {
  identifier: string; // Reference to the video metadata document
  name: string;
  service: string;
}

export interface Post {
  text: string;
  timestamp: number;
  name: string;
  images?: PostImage[]; // Base64 encoded images (max 2)
  videos?: PostVideo[]; // Video references with metadata
  likes?: number;
  retweets?: number;
  replies?: number;
  isLiked?: boolean;
  isRetweeted?: boolean;
  location?: PostLocation; // Reference to the post being replied to (for replies)
  repostMetadata?: RepostMetadata; // Reference to the original post being reposted
}

export interface PostMetadata {
  service: 'DOCUMENT';
  identifier: string;
  name: string;
}

export interface PublishPostParams {
  text: string;
  media: MediaAttachment[];
  identifierOperations: any;
  addNewResources: any;
  userName: string;
  publishMultipleResources: (resources: any[]) => Promise<any>;
  updateNewResources: (resources: any[]) => void;
}

export interface PublishReplyParams {
  text: string;
  media: MediaAttachment[];
  identifierOperations: any;
  addNewResources: any;
  userName: string;
  replyToPostIdentifier: string; // The identifier of the post being replied to
  replyToPostName: string; // The name (author) of the post being replied to
  publishMultipleResources: (resources: any[]) => Promise<any>;
}

export interface PublishRepostParams {
  identifierOperations: any;
  addNewResources: any;
  userName: string;
  originalPost: PostData; // The complete post being reposted
}

/**
 * Convert a File or Blob to base64 string
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Compress an image file before converting to base64
 *
 * @param image - The image file to compress
 * @param quality - Compression quality (0-1), default 0.8
 * @param maxWidth - Maximum width in pixels, default 1920
 * @returns Compressed image as Blob
 */
export async function compressImage(
  image: File,
  quality: number = 0.75,
  maxWidth: number = 1920
): Promise<Blob> {
  // Compress image
  return new Promise<Blob>((resolve, reject) => {
    new Compressor(image, {
      quality,
      maxWidth,
      mimeType: 'image/webp',
      success(result) {
        resolve(result);
      },
      error(err) {
        console.error('Compression error:', err);
        reject(err);
      },
    });
  }).catch((error) => {
    console.warn('Compression failed, using original image:', error);
    return image; // Fallback to original if compression fails
  });
}

/**
 * Convert base64 to object
 */
export function base64ToObject<T>(base64: string): T {
  const jsonString = decodeURIComponent(escape(atob(base64)));
  return JSON.parse(jsonString);
}

export function stringToBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}
/**
 * Normalize each keyword for searchability and wrap with delimiters
 */
function normalizeKeywords(strings: string[]): string {
  const normalizedStrings = strings.map((str) => {
    const normalized = str.trim().toLowerCase();
    return `~${normalized}~`;
  });

  return normalizedStrings.join(',');
}

/**
 * Publish a post with media attachments to the Qortal blockchain
 *
 * This function stores images as base64 inside the post:
 * 1. Converts image files to base64 (max 2 images)
 * 2. Publishes videos as separate QDN resources (VIDEO service)
 * 3. Publishes the post metadata as a DOCUMENT resource
 *
 * @param params - Publishing parameters including text, media, and user info
 * @returns The identifier of the published post
 */
export async function publishPost({
  text,
  media,
  identifierOperations,
  addNewResources,
  userName,
  publishMultipleResources,
  updateNewResources,
}: PublishPostParams): Promise<string> {
  try {
    if (!userName) {
      throw new Error('A Qortal name is required to publish');
    }

    // Generate unique identifier for the post
    const postIdentifier = await identifierOperations.buildIdentifier(
      ENTITY_POST,
      ENTITY_ROOT
    );
    if (!postIdentifier) {
      throw new Error('Failed to create post identifier');
    }

    const resources: any[] = [];
    const videoTempResources: any[] = [];
    const images: PostImage[] = [];
    const videos: PostVideo[] = [];

    // Separate images and videos
    const imageMedia = media.filter((m) => m.type === 'image');
    const videoMedia = media.filter((m) => m.type === 'video');

    // Enforce max 2 images
    if (imageMedia.length > 2) {
      throw new Error('Maximum 2 images allowed per post');
    }

    // Enforce max 1 video
    if (videoMedia.length > 1) {
      throw new Error('Maximum 1 video allowed per post');
    }

    // Compress and convert images to base64 and store in post
    for (const attachment of imageMedia) {
      const compressedImage = await compressImage(attachment.file);
      const base64 = await fileToBase64(compressedImage);
      images.push({ src: base64 });
    }

    // Process video attachments - each gets TWO resources:
    // 1. VIDEO resource for the actual video file
    // 2. DOCUMENT resource for the metadata
    for (let i = 0; i < videoMedia.length; i++) {
      const attachment = videoMedia[i];

      if (!attachment.videoMetadata) {
        throw new Error('Video metadata is required');
      }

      // Sanitize the video title for use in identifier
      const sanitizeTitle = attachment.videoMetadata.title
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .toLowerCase();

      // Generate a unique ID for this video
      const id = uid.rnd();

      // Create identifier for the video file using QTUBE_VIDEO_BASE (direct string, no createSingleIdentifier)
      const videoIdentifier = `${QTUBE_VIDEO_BASE}${sanitizeTitle.slice(0, 30)}_${id}`;

      // Create identifier for the video metadata document (direct string)
      const metadataIdentifier = `${videoIdentifier}_metadata`;

      // Generate a short unique code for the video (5 characters)
      const videoCode = shortuid.rnd();

      // Generate comments identifier for the video
      const commentsId = `${QTUBE_VIDEO_BASE}_cm_${id}`;

      // Create video metadata document
      // videoImage and extracts are already compressed and provided by the dialog

      const videoMetadataDoc: VideoMetadataDocument = {
        title: attachment.videoMetadata.title,
        version: 1,
        htmlDescription: attachment.videoMetadata.description || '',
        fullDescription: stripHtmlTags(
          attachment.videoMetadata.description || ''
        ),
        videoReference: {
          name: userName,
          identifier: videoIdentifier,
          service: 'VIDEO',
        },
        commentsId,
        code: videoCode,
        videoType: attachment.file.type,
        filename: attachment.file.name,
        fileSize: attachment.file.size,
        duration: attachment.videoMetadata.duration || 0,
        category: attachment.videoMetadata.category,
        ...(attachment.videoMetadata.videoImage && {
          videoImage: attachment.videoMetadata.videoImage,
        }),
        ...(attachment.videoMetadata.extracts &&
          attachment.videoMetadata.extracts.length > 0 && {
            extracts: attachment.videoMetadata.extracts,
          }),
        ...(attachment.videoMetadata.subcategory && {
          subcategory: attachment.videoMetadata.subcategory,
        }),
      };

      // Create metadata description with category info
      const subcategoryStr = attachment.videoMetadata.subcategory || '';
      const fullDescriptionText = stripHtmlTags(
        attachment.videoMetadata.description || ''
      );
      const metadescription =
        `**category:${attachment.videoMetadata.category};subcategory:${subcategoryStr};code:${videoCode}**` +
        fullDescriptionText.slice(0, 150);

      // Convert metadata to base64
      const metadataBase64 = await objectToBase64(videoMetadataDoc);

      // Add video file resource to publish queue (with additional metadata)
      resources.push({
        identifier: videoIdentifier,
        service: 'VIDEO',
        file: attachment.file,
        name: userName,
        title: attachment.videoMetadata.title.slice(0, 50),
        description: metadescription,
        tag1: QTUBE_VIDEO_BASE,
        filename: attachment.file.name,
      });
      videoTempResources.push({
        qortalMetadata: {
          name: userName,
          service: 'DOCUMENT',
          identifier: metadataIdentifier,
          created: Date.now(),
        },
        data: videoMetadataDoc,
      });

      // Add metadata document resource to publish queue
      resources.push({
        identifier: metadataIdentifier,
        service: 'DOCUMENT',
        base64: metadataBase64,
        name: userName,
        title: attachment.videoMetadata.title.slice(0, 50),
        description: metadescription,
        tag1: QTUBE_VIDEO_BASE,
        filename: 'video_metadata.json',
        code: videoCode,
      });

      // Store reference to the metadata document in the post
      videos.push({
        identifier: metadataIdentifier,
        service: 'DOCUMENT',
        name: userName,
      });
    }

    // Create post metadata
    const post: Post = {
      text,
      timestamp: Date.now(),
      name: userName,
      ...(images.length > 0 && { images }),
      ...(videos.length > 0 && { videos }),
    };

    // Extract hashtags from post text
    const hashtagMatches = text.match(/#\w+/g);
    let keywordString = '';

    if (hashtagMatches && hashtagMatches.length > 0) {
      // Only take first 2 hashtags and trim them to ensure combined length stays under 150
      const keywords = hashtagMatches.slice(0, 2).map((tag) => {
        // Trim each hashtag to max 70 characters to ensure 2 won't exceed 150
        return tag.length > 70 ? tag.substring(0, 70) : tag;
      });
      keywordString = normalizeKeywords(keywords);
    }

    // Extract @ mentions from post text (only take the first one)
    // Match two formats:
    // 1. @{username with spaces} - wrapped format for names with special chars
    // 2. @username - simple format for names without spaces
    const mentionMatch = text.match(
      /@\{([^}]+)\}|(?:^|\s)@([a-zA-Z0-9_-]+)(?=\s|$)/
    );
    let mentionString = '';

    if (mentionMatch) {
      // Get the mentioned name (without the @ symbol and {})
      // mentionMatch[1] contains @{name with spaces} format
      // mentionMatch[2] contains simple @username format
      const mentionedName = mentionMatch[1] || mentionMatch[2];

      if (mentionedName) {
        // Hash the mentioned name using identifierOperations
        const hashedName = await identifierOperations.hashString(
          mentionedName,
          EnumCollisionStrength.HIGH
        );

        if (hashedName) {
          mentionString = `~@${hashedName}~`;
        }
      }
    }
    // Convert post metadata to base64
    const postBase64 = await objectToBase64(post);

    // Add post metadata resource
    const postResource: any = {
      identifier: postIdentifier,
      service: 'DOCUMENT',
      base64: postBase64,
      name: userName,
    };

    // Build description with hashtags and @ mention
    const descriptionParts: string[] = [];
    if (keywordString) {
      descriptionParts.push(keywordString);
    }
    if (mentionString) {
      descriptionParts.push(mentionString);
    }

    // Only add description if we have keywords or mention
    if (descriptionParts.length > 0) {
      postResource.description = descriptionParts.join(',');
    }

    resources.push(postResource);

    // Publish all resources (videos + post metadata) in a single transaction
    await publishMultipleResources(resources);

    // Update local publish state
    addNewResources(LIST_POSTS_FEED, [
      {
        qortalMetadata: {
          name: userName,
          service: 'DOCUMENT',
          identifier: postIdentifier,
        },
        data: post,
      },
    ]);

    updateNewResources([...videoTempResources]);

    return postIdentifier;
  } catch (error) {
    console.error('Error publishing post:', error);
    throw error;
  }
}

/**
 * Publish a reply to a post with media attachments to the Qortal blockchain
 *
 * This function is similar to publishPost but creates a reply instead:
 * 1. Uses ENTITY_REPLY instead of ENTITY_POST
 * 2. Uses the replied-to post's identifier as the parent instead of ENTITY_ROOT
 * 3. Stores images as base64 inside the reply (max 2 images)
 * 4. Publishes videos as separate QDN resources (VIDEO service)
 * 5. Publishes the reply metadata as a DOCUMENT resource
 *
 * @param params - Publishing parameters including text, media, user info, and reply target
 * @returns The identifier of the published reply
 */
export async function publishReply({
  text,
  media,
  identifierOperations,
  addNewResources,
  userName,
  replyToPostIdentifier,
  replyToPostName,
  publishMultipleResources,
}: PublishReplyParams): Promise<string> {
  try {
    if (!userName) {
      throw new Error('A Qortal name is required to publish');
    }

    if (!replyToPostIdentifier) {
      throw new Error('Reply target post identifier is required');
    }

    if (!replyToPostName) {
      throw new Error('Reply target post name is required');
    }

    // Generate unique identifier for the reply
    // Instead of ENTITY_ROOT, we use the replied-to post's identifier
    const replyIdentifier = await identifierOperations.buildIdentifier(
      ENTITY_REPLY,
      replyToPostIdentifier
    );
    if (!replyIdentifier) {
      throw new Error('Failed to create reply identifier');
    }

    const resources: any[] = [];
    const images: PostImage[] = [];
    const videos: PostVideo[] = [];

    // Separate images and videos
    const imageMedia = media.filter((m) => m.type === 'image');
    const videoMedia = media.filter((m) => m.type === 'video');

    // Enforce max 2 images
    if (imageMedia.length > 2) {
      throw new Error('Maximum 2 images allowed per reply');
    }

    // Enforce max 1 video
    if (videoMedia.length > 1) {
      throw new Error('Maximum 1 video allowed per reply');
    }

    // Compress and convert images to base64 and store in reply
    for (const attachment of imageMedia) {
      const compressedImage = await compressImage(attachment.file);
      const base64 = await fileToBase64(compressedImage);
      images.push({ src: base64 });
    }

    // Process video attachments - each gets TWO resources:
    // 1. VIDEO resource for the actual video file
    // 2. DOCUMENT resource for the metadata
    for (let i = 0; i < videoMedia.length; i++) {
      const attachment = videoMedia[i];

      if (!attachment.videoMetadata) {
        throw new Error('Video metadata is required');
      }

      // Sanitize the video title for use in identifier
      const sanitizeTitle = attachment.videoMetadata.title
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .toLowerCase();

      // Generate a unique ID for this video
      const id = uid.rnd();

      // Create identifier for the video file using QTUBE_VIDEO_BASE (direct string, no createSingleIdentifier)
      const videoIdentifier = `${QTUBE_VIDEO_BASE}${sanitizeTitle.slice(0, 30)}_${id}`;

      // Create identifier for the video metadata document (direct string)
      const metadataIdentifier = `${videoIdentifier}_metadata`;

      // Generate a short unique code for the video (5 characters)
      const videoCode = shortuid.rnd();

      // Generate comments identifier for the video
      const commentsId = `${QTUBE_VIDEO_BASE}_cm_${id}`;

      // Create video metadata document
      // videoImage and extracts are already compressed and provided by the dialog
      const videoMetadataDoc: VideoMetadataDocument = {
        title: attachment.videoMetadata.title,
        version: 1,
        htmlDescription: attachment.videoMetadata.description || '',
        fullDescription: stripHtmlTags(
          attachment.videoMetadata.description || ''
        ),
        videoReference: {
          name: userName,
          identifier: videoIdentifier,
          service: 'VIDEO',
        },
        commentsId,
        code: videoCode,
        videoType: attachment.file.type,
        filename: attachment.file.name,
        fileSize: attachment.file.size,
        duration: attachment.videoMetadata.duration || 0,
        category: attachment.videoMetadata.category,
        ...(attachment.videoMetadata.videoImage && {
          videoImage: attachment.videoMetadata.videoImage,
        }),
        ...(attachment.videoMetadata.extracts &&
          attachment.videoMetadata.extracts.length > 0 && {
            extracts: attachment.videoMetadata.extracts,
          }),
        ...(attachment.videoMetadata.subcategory && {
          subcategory: attachment.videoMetadata.subcategory,
        }),
      };

      // Create metadata description with category info
      const subcategoryStr = attachment.videoMetadata.subcategory || '';
      const fullDescriptionText = stripHtmlTags(
        attachment.videoMetadata.description || ''
      );
      const metadescription =
        `**category:${attachment.videoMetadata.category};subcategory:${subcategoryStr};code:${videoCode}**` +
        fullDescriptionText.slice(0, 150);

      // Convert metadata to base64
      const metadataBase64 = await objectToBase64(videoMetadataDoc);

      // Add video file resource to publish queue (with additional metadata)
      resources.push({
        identifier: videoIdentifier,
        service: 'VIDEO',
        file: attachment.file,
        name: userName,
        title: attachment.videoMetadata.title.slice(0, 50),
        description: metadescription,
        tag1: QTUBE_VIDEO_BASE,
        filename: attachment.file.name,
      });

      // Add metadata document resource to publish queue
      resources.push({
        identifier: metadataIdentifier,
        service: 'DOCUMENT',
        base64: metadataBase64,
        name: userName,
        title: attachment.videoMetadata.title.slice(0, 50),
        description: metadescription,
        tag1: QTUBE_VIDEO_BASE,
        filename: 'video_metadata.json',
        code: videoCode,
      });

      // Store reference to the metadata document in the reply
      videos.push({
        identifier: metadataIdentifier,
        service: 'DOCUMENT',
        name: userName,
      });
    }

    // Create reply metadata (same structure as Post but with location)
    const reply: Post = {
      text,
      timestamp: Date.now(),
      name: userName,
      ...(images.length > 0 && { images }),
      ...(videos.length > 0 && { videos }),
      // Add location reference to the original post being replied to
      location: {
        name: replyToPostName,
        identifier: replyToPostIdentifier,
        service: 'DOCUMENT',
      },
    };

    // Extract hashtags from reply text
    const hashtagMatches = text.match(/#\w+/g);
    let keywordString = '';

    if (hashtagMatches && hashtagMatches.length > 0) {
      // Only take first 2 hashtags and trim them to ensure combined length stays under 150
      const keywords = hashtagMatches.slice(0, 2).map((tag) => {
        // Trim each hashtag to max 70 characters to ensure 2 won't exceed 150
        return tag.length > 70 ? tag.substring(0, 70) : tag;
      });
      keywordString = normalizeKeywords(keywords);
    }

    // Extract @ mentions from reply text (only take the first one)
    // Match two formats:
    // 1. @{username with spaces} - wrapped format for names with special chars
    // 2. @username - simple format for names without spaces
    const mentionMatch = text.match(
      /@\{([^}]+)\}|(?:^|\s)@([a-zA-Z0-9_-]+)(?=\s|$)/
    );
    let mentionString = '';

    if (mentionMatch) {
      // Get the mentioned name (without the @ symbol and {})
      // mentionMatch[1] contains @{name with spaces} format
      // mentionMatch[2] contains simple @username format
      const mentionedName = mentionMatch[1] || mentionMatch[2];

      if (mentionedName) {
        // Hash the mentioned name using identifierOperations
        const hashedName = await identifierOperations.hashString(
          mentionedName,
          EnumCollisionStrength.HIGH
        );

        if (hashedName) {
          mentionString = `~@${hashedName}~`;
        }
      }
    }

    // Add reply indicator with hashed name of the person being replied to
    let replyString = '';
    const hashedReplyToName = await identifierOperations.hashString(
      replyToPostName,
      EnumCollisionStrength.HIGH
    );

    if (hashedReplyToName) {
      replyString = `~rply${hashedReplyToName}~`;
    }

    // Convert reply metadata to base64
    const replyBase64 = await objectToBase64(reply);

    // Add reply metadata resource
    const replyResource: any = {
      identifier: replyIdentifier,
      service: 'DOCUMENT',
      base64: replyBase64,
      name: userName,
    };

    // Build description with hashtags, @ mention, and reply indicator
    const descriptionParts: string[] = [];
    if (keywordString) {
      descriptionParts.push(keywordString);
    }
    if (mentionString) {
      descriptionParts.push(mentionString);
    }
    if (replyString) {
      descriptionParts.push(replyString);
    }

    // Only add description if we have keywords, mention, or reply indicator
    if (descriptionParts.length > 0) {
      replyResource.description = descriptionParts.join(',');
    }

    resources.push(replyResource);

    // Publish all resources (videos + reply metadata) in a single transaction
    await publishMultipleResources(resources);

    // Update local publish state
    // Note: You might want to use a different list name for replies
    addNewResources(`replies-${replyToPostIdentifier}`, [
      {
        qortalMetadata: {
          name: userName,
          service: 'DOCUMENT',
          identifier: replyIdentifier,
        },
        data: reply,
      },
    ]);

    return replyIdentifier;
  } catch (error) {
    console.error('Error publishing reply:', error);
    throw error;
  }
}

/**
 * Publish a repost (retweet) of an existing post to the Qortal blockchain
 *
 * This function creates a repost that uses the same identifier as the original:
 * 1. Uses the original post's identifier (not creating a new one)
 * 2. Publishes under the current user's name
 * 3. Stores metadata about the original post
 * 4. Does not duplicate media - just references the original post
 *
 * @param params - Publishing parameters including user info and original post
 * @returns The identifier of the published repost (same as original)
 */
export async function publishRepost({
  identifierOperations,
  addNewResources,
  userName,
  originalPost,
}: PublishRepostParams): Promise<string> {
  try {
    if (!userName) {
      throw new Error('A Qortal name is required to publish');
    }

    if (!originalPost) {
      throw new Error('Original post is required for reposting');
    }

    // If reposting a repost, get the true original post reference
    // Otherwise use the post being reposted as the original
    const isRepostingARepost = !!originalPost.data.repostMetadata;
    const trueOriginalReference = isRepostingARepost
      ? originalPost.data.repostMetadata!
      : {
          originalPostName: originalPost.qortalMetadata.name,
          originalPostIdentifier: originalPost.qortalMetadata.identifier,
          originalPostService: originalPost.qortalMetadata.service,
        };

    // Check if user is trying to repost their own content (check true original author)
    if (trueOriginalReference.originalPostName === userName) {
      throw new Error('You cannot repost your own content');
    }

    // Build the repost identifier using the original post identifier
    const repostIdentifier = await identifierOperations.buildIdentifier(
      ENTITY_REPOST,
      trueOriginalReference.originalPostIdentifier,
      true
    );

    // Create repost metadata that references the TRUE original post
    const repost: Post = {
      text: originalPost.data.text,
      timestamp: Date.now(),
      name: userName,
      // Reference the original post's images directly
      ...(originalPost.data.images && {
        images: originalPost.data.images,
      }),
      // Include videos if present
      ...(originalPost.data.videos && {
        videos: originalPost.data.videos,
      }),
      // Add metadata to identify this as a repost pointing to the TRUE original
      repostMetadata: trueOriginalReference,
    };

    // Extract hashtags from original post text (if available)
    const postText = originalPost.data.text || '';
    const hashtagMatches = postText.match(/#\w+/g);
    let keywordString = '';

    if (hashtagMatches && hashtagMatches.length > 0) {
      // Only take first 2 hashtags and trim them to ensure combined length stays under 150
      const keywords = hashtagMatches.slice(0, 2).map((tag) => {
        // Trim each hashtag to max 70 characters to ensure 2 won't exceed 150
        return tag.length > 70 ? tag.substring(0, 70) : tag;
      });
      keywordString = normalizeKeywords(keywords);
    }

    // Convert repost metadata to base64
    const repostBase64 = await objectToBase64(repost);

    // Publish the repost metadata using the original post's identifier
    // This will be published under the current user's name
    const publishParams: any = {
      action: 'PUBLISH_QDN_RESOURCE',
      service: 'DOCUMENT',
      name: userName,
      identifier: repostIdentifier,
      data64: repostBase64,
    };

    // Only add description if we have keywords
    if (keywordString) {
      publishParams.description = keywordString;
    }

    await qortalRequest(publishParams);

    // Update local publish state
    addNewResources(LIST_POSTS_FEED, [
      {
        qortalMetadata: {
          name: userName,
          service: 'DOCUMENT',
          identifier: repostIdentifier,
        },
        data: repost,
      },
    ]);

    return repostIdentifier;
  } catch (error) {
    console.error('Error publishing repost:', error);
    throw error;
  }
}

/**
 * Fetch a post from the Qortal blockchain
 */
export async function fetchPost(
  userName: string,
  identifier: string
): Promise<Post | null> {
  try {
    const response = await qortalRequest({
      action: 'FETCH_QDN_RESOURCE',
      service: 'DOCUMENT',
      name: userName,
      identifier: identifier,
    });

    if (!response) {
      return null;
    }

    return base64ToObject<Post>(response);
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

/**
 * List all posts by a user
 */
export async function listUserPosts(userName: string): Promise<PostMetadata[]> {
  try {
    const response = await qortalRequest({
      action: 'LIST_QDN_RESOURCES',
      service: 'DOCUMENT',
      name: userName,
      includeMetadata: true,
    });

    if (!response || !Array.isArray(response)) {
      return [];
    }

    // Filter for post identifiers (those starting with 'post')
    return response.filter(
      (item: any) => item.identifier && item.identifier.startsWith('post')
    );
  } catch (error) {
    console.error('Error listing user posts:', error);
    return [];
  }
}

/**
 * Delete a post and all its associated media from the Qortal blockchain
 *
 * This function deletes the post using the QortalMetadata objects directly.
 * The deleteResource function from useResources will handle the actual deletion.
 * Note: Images are stored as base64 in the post, so only videos need separate deletion.
 *
 * @param postMetadata - The QortalMetadata of the post to delete
 * @param post - The post data containing media identifiers
 * @param deleteResourceFn - The deleteResource function from useResources hook
 * @returns Promise that resolves when deletion is complete
 */
export async function deletePost(
  postMetadata: QortalMetadata,
  _post: Post,
  deleteResourceFn: (resourcesToDelete: QortalMetadata[]) => Promise<boolean>
): Promise<void> {
  try {
    // Only delete the post document itself
    // Videos are NOT deleted - they should be managed separately in Q-Tube
    // Images are stored as base64 in the post, so they're deleted with the post
    const resourcesToDelete: QortalMetadata[] = [postMetadata];

    // Delete the post using the deleteResource function
    await deleteResourceFn(resourcesToDelete);
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

/**
 * Update an existing post's text content and images
 *
 * This updates the post text and/or images.
 * Images are stored as base64 inside the post (max 2 images).
 *
 * @param userName - The name of the user who owns the post
 * @param identifier - The identifier of the post to update
 * @param newText - The new text content for the post
 * @param newMedia - The new media attachments (optional)
 * @param identifierOperations - Operations for identifier management
 * @param updatePublish - Function to update local state
 * @param post - The existing post data
 * @returns Promise that resolves when update is complete
 */
export async function updatePost(
  userName: string,
  identifier: string,
  newText: string,
  _identifierOperations: any,
  updateNewResources: any,
  post: PostData,
  publishMultipleResources: (resources: any[]) => Promise<any>,
  newMedia?: MediaAttachment[]
): Promise<void> {
  try {
    if (!userName) {
      throw new Error('A Qortal name is required to update a post');
    }

    if (!identifier) {
      throw new Error('Post not found');
    }

    const resources: any[] = [];
    let images: PostImage[] | undefined = post.data.images;
    let videos: PostVideo[] | undefined = post.data.videos;
    const videoTempResources: any[] = [];
    // If new media is provided, process it
    if (newMedia && newMedia.length > 0) {
      const imageMedia = newMedia.filter((m) => m.type === 'image');
      const videoMedia = newMedia.filter((m) => m.type === 'video');

      // Enforce max 2 images
      if (imageMedia.length > 2) {
        throw new Error('Maximum 2 images allowed per post');
      }

      // Enforce max 1 video total (existing + new)
      if (videoMedia.length > 1) {
        throw new Error('Maximum 1 video allowed per post');
      }

      // Compress and convert images to base64
      if (imageMedia.length > 0) {
        images = [];
        for (const attachment of imageMedia) {
          const compressedImage = await compressImage(attachment.file);
          const base64 = await fileToBase64(compressedImage);
          images.push({ src: base64 });
        }
      } else {
        images = undefined;
      }

      // Handle videos: separate existing videos from new uploads
      const existingVideos = videoMedia
        .filter((m) => m.existingVideo)
        .map((m) => m.existingVideo!);
      const newVideoUploads = videoMedia.filter((m) => !m.existingVideo);

      // Start with existing videos
      videos = existingVideos.length > 0 ? [...existingVideos] : [];

      // Process new video uploads - same as publishPost
      for (let i = 0; i < newVideoUploads.length; i++) {
        const attachment = newVideoUploads[i];

        if (!attachment.videoMetadata) {
          throw new Error('Video metadata is required');
        }

        // Sanitize the video title for use in identifier
        const sanitizeTitle = attachment.videoMetadata.title
          .replace(/[^a-zA-Z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
          .toLowerCase();

        // Generate a unique ID for this video
        const id = uid.rnd();

        // Create identifier for the video file using QTUBE_VIDEO_BASE
        const videoIdentifier = `${QTUBE_VIDEO_BASE}${sanitizeTitle.slice(0, 30)}_${id}`;

        // Create identifier for the video metadata document
        const metadataIdentifier = `${videoIdentifier}_metadata`;

        // Generate a short unique code for the video (5 characters)
        const videoCode = shortuid.rnd();

        // Generate comments identifier for the video
        const commentsId = `${QTUBE_VIDEO_BASE}_cm_${id}`;

        // Create video metadata document
        const videoMetadataDoc: VideoMetadataDocument = {
          title: attachment.videoMetadata.title,
          version: 1,
          htmlDescription: attachment.videoMetadata.description || '',
          fullDescription: stripHtmlTags(
            attachment.videoMetadata.description || ''
          ),
          videoReference: {
            name: userName,
            identifier: videoIdentifier,
            service: 'VIDEO',
          },
          commentsId,
          code: videoCode,
          videoType: attachment.file.type,
          filename: attachment.file.name,
          fileSize: attachment.file.size,
          duration: attachment.videoMetadata.duration || 0,
          category: attachment.videoMetadata.category,
          ...(attachment.videoMetadata.videoImage && {
            videoImage: attachment.videoMetadata.videoImage,
          }),
          ...(attachment.videoMetadata.extracts &&
            attachment.videoMetadata.extracts.length > 0 && {
              extracts: attachment.videoMetadata.extracts,
            }),
          ...(attachment.videoMetadata.subcategory && {
            subcategory: attachment.videoMetadata.subcategory,
          }),
        };

        // Create metadata description with category info
        const subcategoryStr = attachment.videoMetadata.subcategory || '';
        const fullDescriptionText = stripHtmlTags(
          attachment.videoMetadata.description || ''
        );
        const metadescription =
          `**category:${attachment.videoMetadata.category};subcategory:${subcategoryStr};code:${videoCode}**` +
          fullDescriptionText.slice(0, 150);

        // Convert metadata to base64
        const metadataBase64 = await objectToBase64(videoMetadataDoc);

        // Add video file resource to publish queue
        resources.push({
          identifier: videoIdentifier,
          service: 'VIDEO',
          file: attachment.file,
          name: userName,
          title: attachment.videoMetadata.title.slice(0, 50),
          description: metadescription,
          tag1: QTUBE_VIDEO_BASE,
          filename: attachment.file.name,
        });

        // Add metadata document resource to publish queue
        resources.push({
          identifier: metadataIdentifier,
          service: 'DOCUMENT',
          base64: metadataBase64,
          name: userName,
          title: attachment.videoMetadata.title.slice(0, 50),
          description: metadescription,
          tag1: QTUBE_VIDEO_BASE,
          filename: 'video_metadata.json',
          code: videoCode,
        });
        videoTempResources.push({
          qortalMetadata: {
            name: userName,
            service: 'DOCUMENT',
            identifier: metadataIdentifier,
            created: Date.now(),
          },
          data: videoMetadataDoc,
        });

        // Store reference to the metadata document in the post
        videos.push({
          identifier: metadataIdentifier,
          service: 'DOCUMENT',
          name: userName,
        });
      }

      // Clear videos array if empty
      if (videos.length === 0) {
        videos = undefined;
      }
    }

    // Create updated post with new text, images, and videos
    const updatedPost: Post = {
      ...post.data,
      text: newText,
      timestamp: Date.now(), // Update timestamp
      ...(images && images.length > 0 ? { images } : {}),
      ...(videos && videos.length > 0 ? { videos } : {}),
    };

    // If no images, ensure the images property is removed
    if (!images || images.length === 0) {
      delete updatedPost.images;
    }

    // If no videos, ensure the videos property is removed
    if (!videos || videos.length === 0) {
      delete updatedPost.videos;
    }

    // Extract hashtags from new text
    const hashtagMatches = newText.match(/#\w+/g);
    let keywordString = '';

    if (hashtagMatches && hashtagMatches.length > 0) {
      // Only take first 2 hashtags and trim them to ensure combined length stays under 150
      const keywords = hashtagMatches.slice(0, 2).map((tag) => {
        // Trim each hashtag to max 70 characters to ensure 2 won't exceed 150
        return tag.length > 70 ? tag.substring(0, 70) : tag;
      });
      keywordString = normalizeKeywords(keywords);
    }

    // Extract @ mentions from new text (only take the first one)
    // Match two formats:
    // 1. @{username with spaces} - wrapped format for names with special chars
    // 2. @username - simple format for names without spaces
    const mentionMatch = newText.match(
      /@\{([^}]+)\}|(?:^|\s)@([a-zA-Z0-9_-]+)(?=\s|$)/
    );
    let mentionString = '';

    if (mentionMatch) {
      // Get the mentioned name (without the @ symbol and {})
      // mentionMatch[1] contains @{name with spaces} format
      // mentionMatch[2] contains simple @username format
      const mentionedName = mentionMatch[1] || mentionMatch[2];

      if (mentionedName) {
        // Hash the mentioned name using identifierOperations
        const hashedName = await _identifierOperations.hashString(
          mentionedName,
          EnumCollisionStrength.HIGH
        );

        if (hashedName) {
          mentionString = `~@${hashedName}~`;
        }
      }
    }

    // Convert updated post to base64
    const postBase64 = await objectToBase64(updatedPost);

    // If there are new video resources to publish, publish them first
    if (resources.length > 0) {
      await publishMultipleResources(resources);
    }

    // Publish the updated post (this replaces the existing resource)
    const publishParams: any = {
      action: 'PUBLISH_QDN_RESOURCE',
      service: 'DOCUMENT',
      name: userName,
      identifier: identifier,
      data64: postBase64,
    };

    // Build description with hashtags and @ mention
    const descriptionParts: string[] = [];
    if (keywordString) {
      descriptionParts.push(keywordString);
    }
    if (mentionString) {
      descriptionParts.push(mentionString);
    }

    // Only add description if we have keywords or mention
    if (descriptionParts.length > 0) {
      publishParams.description = descriptionParts.join(',');
    }

    await qortalRequest(publishParams);

    // Update local state
    updateNewResources([
      {
        qortalMetadata: { ...post.qortalMetadata, updated: Date.now() },
        data: updatedPost,
      },
    ]);
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}

/**
 * Like a post by publishing a simple "liked" resource
 *
 * @param postIdentifier - The identifier of the post to like
 * @param identifierOperations - Operations for identifier management
 * @param userName - The name of the user liking the post
 * @param addNewResources - Function to update local state
 * @returns The identifier of the published like resource
 */
export async function likePost(
  postIdentifier: string,
  identifierOperations: any,
  userName: string,
  addNewResources: any
): Promise<string> {
  try {
    if (!userName) {
      throw new Error('A Qortal name is required to like a post');
    }

    if (!postIdentifier) {
      throw new Error('Post identifier is required');
    }

    // Create a unique identifier for the like by hashing separately and concatenating
    const likeHash = await identifierOperations.hashString(
      'like',
      EnumCollisionStrength.HIGH
    );
    const postHash = await identifierOperations.hashString(
      postIdentifier,
      EnumCollisionStrength.HIGH
    );

    if (!likeHash || !postHash) {
      throw new Error('Failed to create like identifier');
    }

    const likeIdentifier = likeHash + postHash;

    // Create simple like data
    const likeData = 'this post has been liked';

    // Convert to base64
    const likeBase64 = stringToBase64(likeData);
    // Publish the like
    await qortalRequest({
      action: 'PUBLISH_QDN_RESOURCE',
      service: 'DOCUMENT',
      name: userName,
      identifier: likeIdentifier,
      data64: likeBase64,
    });
    addNewResources(`${likeIdentifier}-${userName}`, [
      {
        qortalMetadata: {
          name: userName,
          service: 'DOCUMENT',
          identifier: likeIdentifier,
          size: 100,
          created: Date.now(),
        },
        data: {},
      },
    ]);
    addNewResources(likeIdentifier, [
      {
        qortalMetadata: {
          name: userName,
          service: 'DOCUMENT',
          identifier: likeIdentifier,
          size: 100,
          created: Date.now(),
        },
        data: {},
      },
    ]);
    return likeIdentifier;
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
}

/**
 * Unlike a post by deleting the like resource
 *
 * @param postIdentifier - The identifier of the post to unlike
 * @param identifierOperations - Operations for identifier management
 * @param userName - The name of the user unliking the post
 * @param deleteResourceFn - The deleteResource function from lists
 * @returns Promise that resolves when deletion is complete
 */
export async function unlikePost(
  postIdentifier: string,
  identifierOperations: any,
  userName: string,
  deleteResourceFn: (resourcesToDelete: QortalMetadata[]) => Promise<boolean>
): Promise<void> {
  try {
    if (!userName) {
      throw new Error('A Qortal name is required to unlike a post');
    }

    if (!postIdentifier) {
      throw new Error('Post identifier is required');
    }

    // Get the like identifier by hashing separately and concatenating
    const likeHash = await identifierOperations.hashString(
      'like',
      EnumCollisionStrength.HIGH
    );
    const postHash = await identifierOperations.hashString(
      postIdentifier,
      EnumCollisionStrength.HIGH
    );

    if (!likeHash || !postHash) {
      throw new Error('Failed to create like identifier');
    }

    const likeIdentifier = likeHash + postHash;

    // Delete the like resource
    await deleteResourceFn([
      {
        name: userName,
        service: 'DOCUMENT',
        identifier: likeIdentifier,
      } as QortalMetadata,
    ]);
  } catch (error) {
    console.error('Error unliking post:', error);
    throw error;
  }
}

/**
 * Follow a user by publishing a simple "following" resource
 *
 * @param targetUserName - The name of the user to follow
 * @param identifierOperations - Operations for identifier management
 * @param currentUserName - The name of the user doing the following
 * @param addNewResources - Function to update local state
 * @returns The identifier of the published follow resource
 */
export async function followUser(
  targetUserName: string,
  identifierOperations: any,
  currentUserName: string,
  addNewResources: any
): Promise<string> {
  try {
    if (!currentUserName) {
      throw new Error('A Qortal name is required to follow a user');
    }

    if (!targetUserName) {
      throw new Error('Target user name is required');
    }

    if (targetUserName === currentUserName) {
      throw new Error('You cannot follow yourself');
    }

    // Create a unique identifier for the follow by hashing separately and concatenating
    const followHash = await identifierOperations.hashString(
      'follow',
      EnumCollisionStrength.HIGH
    );
    const userHash = await identifierOperations.hashString(
      targetUserName,
      EnumCollisionStrength.HIGH
    );

    if (!followHash || !userHash) {
      throw new Error('Failed to create follow identifier');
    }

    const followIdentifier = followHash + userHash;

    // Create follow data with target username for easy retrieval
    const followData = {
      followedName: targetUserName,
    };

    // Convert to base64
    const followBase64 = await objectToBase64(followData);

    // Publish the follow
    await qortalRequest({
      action: 'PUBLISH_QDN_RESOURCE',
      service: 'DOCUMENT',
      name: currentUserName,
      identifier: followIdentifier,
      data64: followBase64,
    });

    addNewResources(`${followIdentifier}-${currentUserName}`, [
      {
        qortalMetadata: {
          name: currentUserName,
          service: 'DOCUMENT',
          identifier: followIdentifier,
          size: 100,
          created: Date.now(),
        },
        data: {
          targetUserName,
          timestamp: Date.now(),
        },
      },
    ]);
    addNewResources(followIdentifier, [
      {
        qortalMetadata: {
          name: currentUserName,
          service: 'DOCUMENT',
          identifier: followIdentifier,
          size: 100,
          created: Date.now(),
        },
        data: {
          targetUserName,
          timestamp: Date.now(),
        },
      },
    ]);

    return followIdentifier;
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
}

/**
 * Unfollow a user by deleting the follow resource
 *
 * @param targetUserName - The name of the user to unfollow
 * @param identifierOperations - Operations for identifier management
 * @param currentUserName - The name of the user doing the unfollowing
 * @param deleteResourceFn - The deleteResource function from lists
 * @returns Promise that resolves when deletion is complete
 */
export async function unfollowUser(
  targetUserName: string,
  identifierOperations: any,
  currentUserName: string,
  deleteResourceFn: (resourcesToDelete: QortalMetadata[]) => Promise<boolean>
): Promise<void> {
  try {
    if (!currentUserName) {
      throw new Error('A Qortal name is required to unfollow a user');
    }

    if (!targetUserName) {
      throw new Error('Target user name is required');
    }

    // Get the follow identifier by hashing separately and concatenating
    const followHash = await identifierOperations.hashString(
      'follow',
      EnumCollisionStrength.HIGH
    );
    const userHash = await identifierOperations.hashString(
      targetUserName,
      EnumCollisionStrength.HIGH
    );

    if (!followHash || !userHash) {
      throw new Error('Failed to create follow identifier');
    }

    const followIdentifier = followHash + userHash;

    // Delete the follow resource
    await deleteResourceFn([
      {
        name: currentUserName,
        service: 'DOCUMENT',
        identifier: followIdentifier,
      } as QortalMetadata,
    ]);
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
}
