CREATE OR REPLACE FUNCTION get_posts(
  input_account_id uuid,
  input_post_type text DEFAULT NULL,
  input_owner_id uuid DEFAULT NULL,
  input_cursor_post_id int8 DEFAULT NULL,
  input_limit int DEFAULT 10,
  input_post_ids int8[] DEFAULT NULL,
  input_liked boolean DEFAULT false,
  input_liked_cursor timestamptz DEFAULT NULL,
  input_bookmarked boolean DEFAULT false,
  input_bookmark_cursor timestamptz DEFAULT NULL,
  input_search_term text DEFAULT NULL
)
RETURNS TABLE (
  postID int8,
  postType text,
  edited boolean,
  ownerAccountID uuid,
  username text,
  isFollowing boolean,
  media jsonb,
  likesCount int8,
  commentsCount int8,
  sharesCount int8,
  description text,
  isBookmarked boolean,
  createdAt timestamptz,
  collectionName text,
  likeAt timestamptz,
  savedAt timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF input_liked THEN
    RETURN QUERY
    SELECT
      p."postID",
      p."postType",
      p."edited",
      p."ownerAccountID",
      prof."username",
      EXISTS (
        SELECT 1 FROM public."Connections"
        WHERE "followerAccountID" = input_account_id
          AND "targetAccountID" = p."ownerAccountID"
      ) AS isFollowing,
      (
        SELECT jsonb_agg(jsonb_build_object(
          'mediaType', m."mediaType",
          'mediaPath', m."mediaPath",
          'mediaAspectRatio', m."mediaAspectRatio",
          'renderAspectRatio', m."renderAspectRatio",
          'cropOption', m."cropOption",
          'trackID', tr."trackID",
          'trackName', tr."trackName",
          'artistName', tr."artistName"
        ))
        FROM public."Media" m
        LEFT JOIN public."Track" tr ON m."trackID" = tr."trackID"
        WHERE m."postID" = p."postID"
      ) AS media,
      p."likesCount",
      (
        SELECT COUNT(*) FROM public."Comments"
        WHERE "postID" = p."postID" AND "commentType" = 'Main'
      ) AS commentsCount,
      p."sharesCount",
      p."description",
      EXISTS (
        SELECT 1 FROM public."Bookmarks"
        WHERE "postID" = p."postID"
        AND "ownerAccountID" = input_account_id
      ) AS isBookmarked,
      p."createdAt",
      NULL::text AS collectionName,
      pl."likeAt",
      NULL::timestamptz AS savedAt
    FROM public."Post Likes" pl
    JOIN public."Post" p ON pl."postID" = p."postID"
    JOIN public."Profile" prof ON p."ownerAccountID" = prof."accountID"
    WHERE pl."accountID" = input_account_id
      AND (input_liked_cursor IS NULL OR pl."likeAt" < input_liked_cursor)
    ORDER BY pl."likeAt" DESC
    LIMIT input_limit;

  ELSIF input_bookmarked THEN
    RETURN QUERY
    SELECT
      p."postID",
      p."postType",
      p."edited",
      p."ownerAccountID",
      prof."username",
      EXISTS (
        SELECT 1 FROM public."Connections"
        WHERE "followerAccountID" = input_account_id
          AND "targetAccountID" = p."ownerAccountID"
      ) AS isFollowing,
      (
        SELECT jsonb_agg(jsonb_build_object(
          'mediaType', m."mediaType",
          'mediaPath', m."mediaPath",
          'mediaAspectRatio', m."mediaAspectRatio",
          'renderAspectRatio', m."renderAspectRatio",
          'cropOption', m."cropOption",
          'trackID', tr."trackID",
          'trackName', tr."trackName",
          'artistName', tr."artistName"
        ))
        FROM public."Media" m
        LEFT JOIN public."Track" tr ON m."trackID" = tr."trackID"
        WHERE m."postID" = p."postID"
      ) AS media,
      p."likesCount",
      (
        SELECT COUNT(*) FROM public."Comments"
        WHERE "postID" = p."postID" AND "commentType" = 'Main'
      ) AS commentsCount,
      p."sharesCount",
      p."description",
      TRUE AS isBookmarked,
      p."createdAt",
      b."collectionName",
      NULL::timestamptz AS likeAt,
      b."savedAt"
    FROM public."Bookmarks" b
    JOIN public."Post" p ON b."postID" = p."postID"
    JOIN public."Profile" prof ON p."ownerAccountID" = prof."accountID"
    WHERE b."ownerAccountID" = input_account_id
      AND (input_bookmark_cursor IS NULL OR b."savedAt" < input_bookmark_cursor)
    ORDER BY b."savedAt" DESC
    LIMIT input_limit;

  ELSE
    RETURN QUERY
    SELECT
      p."postID",
      p."postType",
      p."edited",
      p."ownerAccountID",
      prof."username",
      EXISTS (
        SELECT 1 FROM public."Connections"
        WHERE "followerAccountID" = input_account_id
          AND "targetAccountID" = p."ownerAccountID"
      ) AS isFollowing,
      (
        SELECT jsonb_agg(jsonb_build_object(
          'mediaType', m."mediaType",
          'mediaPath', m."mediaPath",
          'mediaAspectRatio', m."mediaAspectRatio",
          'renderAspectRatio', m."renderAspectRatio",
          'cropOption', m."cropOption",
          'trackID', tr."trackID",
          'trackName', tr."trackName",
          'artistName', tr."artistName"
        ))
        FROM public."Media" m
        LEFT JOIN public."Track" tr ON m."trackID" = tr."trackID"
        WHERE m."postID" = p."postID"
      ) AS media,
      p."likesCount",
      (
        SELECT COUNT(*) FROM public."Comments"
        WHERE "postID" = p."postID" AND "commentType" = 'Main'
      ) AS commentsCount,
      p."sharesCount",
      p."description",
      EXISTS (
        SELECT 1 FROM public."Bookmarks"
        WHERE "postID" = p."postID"
          AND "ownerAccountID" = input_account_id
      ) AS isBookmarked,
      p."createdAt",
      NULL::text AS collectionName,
      NULL::timestamptz AS likeAt,
      NULL::timestamptz AS savedAt
    FROM public."Post" p
    JOIN public."Profile" prof ON p."ownerAccountID" = prof."accountID"
    WHERE (input_post_type IS NULL OR p."postType" = input_post_type)
      AND (input_owner_id IS NULL OR p."ownerAccountID" = input_owner_id)
      AND (input_cursor_post_id IS NULL OR p."postID" > input_cursor_post_id)
      AND (input_post_ids IS NULL OR p."postID" = ANY(input_post_ids))
      AND (
        input_search_term IS NULL
        OR EXISTS (
          SELECT 1
          FROM unnest(string_to_array(input_search_term, ' ')) AS term
          WHERE p."description" ~* ('\m' || term || '\M')
        )
      )
    ORDER BY p."postID" ASC
    LIMIT input_limit;
  END IF;
END;
$$;
