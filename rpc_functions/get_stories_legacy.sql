--note to self: this functions is for returning stories for homepage and profile page.
--if input_owner_id is specified, the stories of that specific user are returned
--if not specified, the stories of all of the followed users of the client are returned.

create or replace function get_stories(
  input_account_id uuid,
  input_owner_id uuid default null,
  input_limit int default 20,
  input_cursor_index timestamptz default now()
)
returns table (
  postID int8,
  postType text,
  ownerAccountID uuid,
  username text,
  artistName text,
  trackName text,
  media jsonb,
  likesCount int8,
  commentsCount int8,
  createdAt timestamptz,
  expiresAt timestamptz
)
language sql
as $$
  select
    p."postID",
    p."postType",
    p."ownerAccountID",
    pr."username",
    ta."artistName",
    ta."trackName",
    (
      select jsonb_agg(jsonb_build_object(
        'mediaID', m."mediaID",
        'mediaType', m."mediaType",
        'mediaPath', m."mediaPath",
        'mediaAspectRatio', m."mediaAspectRatio",
        'renderAspectRatio', m."renderAspectRatio",
        'cropOption', m."cropOption"
      ))
      from "Media" m
      where m."postID" = p."postID"
    ) as media,
    p."likesCount",
    (
      select count(*) from "Comments" c where c."postID" = p."postID"
    ) as commentsCount,
    p."createdAt",
    p."expiresAt"
  from "Post" p
  join "Profile" pr on pr."accountID" = p."ownerAccountID"
  left join "Post Audio" pa on pa."postID" = p."postID"
  left join "Track" ta on ta."trackID" = pa."trackID"
  where p."postType" = 'Story'
    and p."expiresAt" > now()
    and (
      input_owner_id is not null and p."ownerAccountID" = input_owner_id
      or (
        input_owner_id is null
        and exists (
          select 1 from "Connections" c
          where c."followerAccountID" = input_account_id
            and c."targetAccountID" = p."ownerAccountID"
        )
      )
    )
    and p."createdAt" < input_cursor_index
  order by p."createdAt" desc
  limit input_limit
$$;
