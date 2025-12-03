export const ENTITY_ROOT = 'ROOT';
export const ENTITY_POST = 'POST';
export const ENTITY_REPLY = 'REPLY';
export const LIST_POSTS_FEED = 'LIST_POSTS_FEED';
export const ENTITY_REPOST = 'REPOST';
// Video publishing constants
export const useTestIdentifiers = false;

export const QTUBE_VIDEO_BASE = useTestIdentifiers
  ? 'MYTEST3_vid_'
  : 'qtube_vid_';

export const QTUBE_PLAYLIST_BASE = useTestIdentifiers
  ? 'MYTEST3_playlist_'
  : 'qtube_playlist_';

export const SUPER_LIKE_BASE = useTestIdentifiers
  ? 'MYTEST3_superlike_'
  : 'qtube_superlike_';

export const LIKE_BASE = useTestIdentifiers ? 'MYTEST3_like_' : 'qtube_like_';

export const COMMENT_BASE = useTestIdentifiers
  ? 'qc_v1_MYTEST3_'
  : 'qc_v1_qtube_';

export const FOR = useTestIdentifiers ? 'FORTEST5' : 'FOR096';
export const FOR_SUPER_LIKE = useTestIdentifiers ? 'MYTEST3_sl' : `qtube_sl`;
export const FOR_LIKE = useTestIdentifiers ? 'MYTEST3_like' : `qtube_like`;

// Updates trigger
export const trigger_like_identifier = 1759360823338;
