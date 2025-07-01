create or replace function get_comment_replies(
  input_main_comment_id int8,
  input_cursor timestamptz default null,
  input_limit int default 5
)
returns table (
  commentid int8,
  createdat timestamptz,
  text text,
  postid int8,
  parentcommentid int8,
  commenteraccountid uuid,
  commenttype text,
  likescount integer,
  edited boolean,
  maincommentid int8,
  parentcommentusername text
)
language plpgsql
as $$
begin
  return query
  select 
    c."commentID",
    c."createdAt",
    c."text",
    c."postID",
    c."parentCommentID",
    c."commenterAccountID",
    c."commentType",
    c."likesCount",
    c."edited",
    c."mainCommentID",
    pc."username" as parentcommentusername
  from 
    public."Comments" c
  left join public."Comments" p on c."parentCommentID" = p."commentID"
  left join public."Profile" pc on p."commenterAccountID" = pc."accountID"
  where 
    c."mainCommentID" = input_main_comment_id
    and c."commentType" = 'Reply'
    and (input_cursor is null or c."createdAt" < input_cursor)
  order by 
    c."createdAt" desc
  limit input_limit;
end;
$$;
