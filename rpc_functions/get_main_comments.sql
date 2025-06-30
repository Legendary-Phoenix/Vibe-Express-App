create or replace function get_main_comments(
  input_post_id int8,
  input_cursor timestamptz default null,
  input_limit int default 10
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
  replycount int8,
  replies jsonb
)
language sql
as $$
  with main_comments as (
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
      c."mainCommentID"
    from 
      public."Comments" c
    where 
      c."postID" = input_post_id
      and c."commentType" = 'Main'
      and (input_cursor is null or c."createdAt" < input_cursor)
    order by 
      c."createdAt" desc
    limit 
      input_limit
  )
  select 
    mc."commentID",
    mc."createdAt",
    mc."text",
    mc."postID",
    mc."parentCommentID",
    mc."commenterAccountID",
    mc."commentType",
    mc."likesCount",
    mc."edited",
    mc."mainCommentID",

    (
      select count(*)
      from public."Comments" r
      where r."mainCommentID" = mc."commentID"
        and r."commentType" = 'Reply'
    ) as replycount,

    (
      select jsonb_agg(
        jsonb_build_object(
          'commentid', r."commentID",
          'createdat', r."createdAt",
          'text', r."text",
          'postid', r."postID",
          'parentcommentid', r."parentCommentID",
          'commenteraccountid', r."commenterAccountID",
          'commenttype', r."commentType",
          'likescount', r."likesCount",
          'edited', r."edited",
          'maincommentid', r."mainCommentID",
          'parentcommentusername', pc."displayName"
        )
        order by r."createdAt" desc
      )
      from (
        select *
        from public."Comments" r
        where r."mainCommentID" = mc."commentID"
          and r."commentType" = 'Reply'
        order by r."createdAt" desc
        limit 3
      ) r
      left join public."Comments" p on r."parentCommentID" = p."commentID"
      left join public."Profile" pc on p."commenterAccountID" = pc."accountID"
    ) as replies
  from 
    main_comments mc
  order by 
    mc."createdAt" desc;
$$;
