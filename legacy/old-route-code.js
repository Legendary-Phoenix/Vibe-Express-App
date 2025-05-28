app.get("/bookmarks")

const {data: bookmarkData,error: bookmarkError}=await supabase
        .from("Bookmarks")
        .select("postID, collectionName, savedAt")
        .eq("ownerAccountID",accountID)
        .lt("savedAt",cursorIndex)
        .order("savedAt",{ascending:false})
        .limit(limit);
    if (bookmarkError){
        return res.json({
            success:false,
            errorMessage: "Bookmarks Error: "+bookmarkError.message
        });
    }
    //console.log("Bokkmark Data: ",bookmarkData);
    const bookmarkPostIDs=bookmarkData.map(item=>item.postID);
    //console.log("Bookmark Post IDs:",bookmarkPostIDs);
    const collectionMap=bookmarkData.reduce((acc,item)=>{
        acc[item.postID]=item.collectionName;
        return acc;
    },{});
    const nextCursor=bookmarkData.length ? bookmarkData[bookmarkData.length-1].savedAt : null;
    //console.log("Next cursor"+nextCursor);
    if(bookmarkPostIDs.length>0){
        const { data: bookmarkedPostsData, error: bookmarkedPostsError } = await supabase.rpc("get_posts", {
            input_account_id: accountID,
            input_post_type: null, 
            input_owner_id: null,
            input_cursor_post_id: null,
            input_limit: limit,
            input_post_ids: bookmarkPostIDs
        });
        //console.log("BookmarkedPostsData:\n",bookmarkedPostsData);
        if (bookmarkedPostsError){
            return res.status(500).json({
                success: false,
                errorMessage: "Bookmarked Posts Error: "+bookmarkedPostsError.message
            });
        } else{
            const processedPostData=bookmarkedPostsData.map((item)=> ({
                ...item,
                collectionName:collectionMap[item.postid],
            }));
            //console.log ("Processed Post Data\n", processedPostData);
        
            return res.status(200).json({
                success: true,
                nextCursor: nextCursor,
                data: processedPostData,
            })
        }
    }
    return res.status(200).json({
        success: true,
        nextCursor: nextCursor,
        data: [],
    })



    app.get("/likedposts")




        const {data: likedData, error: likedError}= await supabase
        .from("Post Likes")
        .select("postID, likeAt")
        .eq("accountID", accountID)
        .lt("likeAt",cursorIndex)
        .order("likeAt",{ascending:false})
        .limit(limit);
    if (likedError){
        return res.status(500).json({
            success: false,
            errorMessage: "Liked Error: "+likedError.message
        });
    }
    const likedPostIDs=likedData.map(item => item.postID);
    const nextCursor=likedData.length ? likedData[likedData.length-1].likeAt : null;
    if (likedPostIDs.length >0){
        const { data: likedPostsData, error: likedPostsError } = await supabase.rpc("get_posts", {
            input_account_id: accountID,
            input_post_type: null, 
            input_owner_id: null,
            input_cursor_post_id: null,
            input_limit: limit,
            input_post_ids: likedPostIDs
        });
        if (likedPostsError){
            return res.status(500).json({
                success: false,
                errorMessage: "Liked Posts Error: "+likedPostsError.message
            });
        } else{
            return res.status(200).json({
                success: true,
                nextCursor: nextCursor,
                data: likedPostsData,
            })
        }
        
    }
    res.status(200).json({
        success: true,
        nextCursor: nextCursor,
        data: [],
    })

