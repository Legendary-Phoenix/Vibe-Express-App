CREATE OR REPLACE FUNCTION get_fleet_data(
  input_account_ids UUID[],
  input_viewer_id UUID
)
RETURNS TABLE (
  accountID UUID,
  username TEXT,
  avatarPath TEXT,
  isWatched BOOLEAN,
  isStoryAvailable BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    prof."accountID",
    prof."username",
    prof."avatarPath",
    EXISTS (
      SELECT 1
      FROM "Story Watch" sw
      JOIN "Post" p ON p."postID" = sw."postID"
      WHERE sw."accountID" = input_viewer_id
        AND p."ownerAccountID" = prof."accountID"
    ) AS isWatched,
    EXISTS (
      SELECT 1
      FROM "Post" p
      WHERE p."ownerAccountID" = prof."accountID"
        AND p."expiresAt" > NOW()
    ) AS isStoryAvailable
  FROM "Profile" prof
  WHERE prof."accountID" = ANY(input_account_ids);
END;
$$ LANGUAGE plpgsql;
