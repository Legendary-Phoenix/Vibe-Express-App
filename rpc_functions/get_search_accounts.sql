create or replace function get_search_accounts (
  input_account_id uuid,
  input_search_term text,
  input_cursor_follower_count int default null,
  input_cursor_account_id uuid default null,
  input_limit int default 50
)
returns table (
  accountID uuid,
  username text,
  displayName text,
  followerCount int
)
language sql
as $$
  with matched_profiles as (
    select 
      pr."accountID",
      pr."username",
      pr."displayName"
    from public."Profile" pr
    where pr."username" ilike input_search_term || '%'
       or pr."displayName" ilike input_search_term || '%'
  ),
  follower_counts as (
    select 
      "targetAccountID" as account_id,
      count(*) as follower_count
    from public."Connections"
    group by "targetAccountID"
  )
  select 
    mp."accountID",
    mp."username",
    mp."displayName",
    coalesce(fc.follower_count, 0) as followerCount
  from matched_profiles mp
  left join follower_counts fc
    on fc.account_id = mp."accountID"
  where (
    input_cursor_follower_count is null 
    or (
      coalesce(fc.follower_count, 0) < input_cursor_follower_count
      or (
        coalesce(fc.follower_count, 0) = input_cursor_follower_count
        and mp."accountID" > input_cursor_account_id
      )
    )
  )
  order by coalesce(fc.follower_count, 0) desc, mp."accountID" asc
  limit input_limit;
$$;
