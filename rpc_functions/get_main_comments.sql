create or replace function get_main_comments(
  input_post_id int8,
  input_limit integer default 20,
  input_cursor timestamp with time zone default now()
)
returns table (
  comment jsonb
)
language plpgsql
as $$
begin
  return query
  select jsonb_build_object(
    'commentID', main.commentID,
    'createdAt', main.createdAt,
    'text', main.text,
    'postID', main.postID,
    'parentCommentID', main.parentCommentID,
    'commenterAccountID', main.commenterAccountID,
    'commentType', main.commentType,
    'likesCount', main.likesCount,
    'edited', main.edited,
    'replies', (
      select jsonb_agg(jsonb_build_object(
        'commentID', reply.commentID,
        'createdAt', reply.createdAt,
        'text', reply.text,
        'postID', reply.postID,
        'parentCommentID', reply.parentCommentID,
        'commenterAccountID', reply.commenterAccountID,
        'commentType', reply.commentType,
        'likesCount', reply.likesCount,
        'edited', reply.edited
      ) order by reply.createdAt desc)
      from Comments reply
      where reply.mainCommentID = main.commentID
        and reply.commentType = 'Reply'
      limit 3
    )
  ) as comment
  from Comments main
  where main.commentType = 'Main'
    and main.postID = input_post_id
    and main.createdAt < input_cursor
  order by main.createdAt desc
  limit input_limit;
end;
$$;
