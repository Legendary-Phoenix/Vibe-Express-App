create or replace function get_search_history(
  input_account_id uuid
)
returns table (
  typeOfSearch text,
  searchTerm text,
  searchedAt timestamptz,
  displayName text,
  username text,
  accountID uuid
)
language sql
as $$
  select
    sh."typeOfSearch",
    sh."searchTerm",
    sh."searchedAt",
    p."displayName",
    p."username",
    p."accountID"
  from public."Search History" sh
  left join public."Profile" p
    on sh."typeOfSearch" = 'Account' and sh."searchTerm" = p."username"
  where sh."accountID" = input_account_id
  order by sh."searchedAt" desc
  limit 50;
$$;
