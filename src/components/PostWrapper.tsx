import { Post, PostData } from './Post';
import { useOriginalPostData } from '../hooks/useOriginalPostData';
import { LoaderItem } from './LoaderState';

interface PostWrapperProps {
  post: PostData;
  onLike?: (postId: string, isLiked: boolean) => void;
  onRetweet?: (postId: string, post: PostData) => void;
  onReply?: (postId: string, postName: string) => void;
  onShare?: (postId: string, postName: string) => void;
  onEdit?: (postId: string, post: PostData) => void;
  onDelete?: (post: PostData) => void;
  onPin?: (postId: string) => void;
  onClick?: (postId: string, postName: string) => void;
  onUserClick?: (userName: string) => void;
  onHashtagClick?: (hashtag: string) => void;
  isPinned?: boolean;
  isReplyInThread?: boolean;
}

/**
 * Wrapper component that handles fetching original post data for reposts
 * and passes it to the Post component
 */
export function PostWrapper(props: PostWrapperProps) {
  const { post, ...otherProps } = props;

  // Determine if this is a repost
  const isRepost = !!post.data?.repostMetadata;

  // If this is a repost, fetch the TRUE original post data
  // Otherwise just use the post as-is
  const originalPostData = useOriginalPostData(post);

  // Show loading state while fetching original post data (only for reposts)
  if (isRepost && !originalPostData) {
    return <LoaderItem />;
  }

  // If this is a repost, merge the reposter's info with the original post's content
  // This ensures we always show the TRUE original post content, even if reposting a repost
  const displayPost: PostData =
    isRepost && originalPostData
      ? {
          ...post,
          // Use the ORIGINAL post's metadata for replies/interactions (identifier, name, service)
          // This ensures replies go to the original post, consolidating discussion
          qortalMetadata: originalPostData.qortalMetadata,
          // Preserve who actually did the reposting (for UI display)
          reposterName: post.qortalMetadata.name,
          reposterIdentifier: post.qortalMetadata.identifier,
          reposterService: post.qortalMetadata.service,
          // Use the TRUE original post's data (content from the first post in the chain)
          data: {
            ...originalPostData.data,
            // Keep the repostMetadata so Post component knows it's a repost
            repostMetadata: post.data.repostMetadata,
          },
        }
      : originalPostData || post;

  return <Post post={displayPost} {...otherProps} />;
}
