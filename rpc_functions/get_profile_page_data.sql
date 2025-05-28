create or replace function get_profile_page_data(
  input_account_id uuid
)
returns table (
  accountID uuid,
  username text,
  displayName text,
  profileDescription text,
  numberOfPosts int8,
  numberOfFollowers int8,
  numberOfFollowing int8,
  savedCollections text[]
)
language plpgsql
as $$
begin
  return query
  select
    p."accountID",
    p."username",
    p."displayName",
    p."profileDescription",
    (select count(*) from public."Post" where "ownerAccountID" = input_account_id) as "numberOfPosts",
    (select count(*) from public."Connections" where "targetAccountID" = input_account_id) as "numberOfFollowers",
    (select count(*) from public."Connections" where "followerAccountID" = input_account_id) as "numberOfFollowing",
    (
      select array_agg(distinct "collectionName")
      from public."Bookmarks"
      where "accountID" = input_account_id
        and "collectionName" is not null
    ) as "savedCollections"
  from public."Profile" p
  where p."accountID" = input_account_id;
end;
$$;
