import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import shuffleArray from "./utils/shuffleArray.js";
import { sendSuccessResponse, sendErrorResponse, handleJoinedResponse } from "./utils/responseUtils.js";
import joinFleetDataForComment from "./utils/joinFleetForComment.js";
import authRoutes from "./routes/auth.js";
import { attachSupabase } from "./middleware/auth.js";

process.env.NODE_ENV !== 'production' && dotenv.config();
const app=express();
const PORT=process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

//starting the server
app.listen(PORT, ()=>{
    console.log(`Server is listening on port ${PORT}`);
});

//external routes


//routes
app.get("/",async(req,res)=>{
    res.send("Hello Vibe-Express-App");
});

app.get("/post",attachSupabase, async(req,res)=>{
    const {accountID, postType, ownerAccountID, cursorIndex=1, limit, random}=req.query;
    if (!accountID || !postType){
       return sendErrorResponse({res,statusCode:400,errorMessage:"accountID OR postType cannot be null"});
    }
    
    const {data:postData, error: postError}=await req.supabase.rpc("get_posts",{
        input_account_id: accountID,
        input_post_type: postType,
        input_owner_id: ownerAccountID,
        input_cursor_post_id: cursorIndex,
        input_limit: limit,
        input_post_ids: null
    });
    if (postError){
        return sendErrorResponse({res,statusCode: 500,errorMessage:`Cannot fetch post data: ${postError.message}`});
    }
    //console.log(postData);
    if (postData.length===0){
        return sendSuccessResponse({res,data:[],nextCursor:{nextCursor:null}});
    }
    const randomizedData= (!random || random===true) ? shuffleArray([...postData]) : postData;
    return handleJoinedResponse({accountID,fieldToExtractIDs:"owneraccountid",res,reqSupabase:req.supabase,
        data:randomizedData,nextCursor:{nextCursor: postData[postData.length-1].postid}});
});

app.get("/profile", attachSupabase, async (req,res)=>{
    const accountID=req.query.accountID;

    if(!accountID){
        return sendErrorResponse({res,statusCode:400,errorMessage:"accountID cannot be null"});
    }

    const{data: profileData, error: profileError}=await req.supabase.rpc("get_profile_page_data",{
        input_account_id: accountID
    });

    if(profileError){
        return sendErrorResponse({res,statusCode:500,errorMessage:"Profile Error: "+profileError.message});
    }

    if(!profileData){
        return sendSuccessResponse({res,data:[]});
    }
    return handleJoinedResponse({accountID,fieldToExtractIDs:"accountid",res,reqSupabase:req.supabase,data:profileData});
});

app.get("/likedposts", attachSupabase, async (req,res)=>{
    const {accountID, cursorIndex, limit=20}=req.query;
    //const formattedCursorIndex=cursorIndex===null ? new Date() : new Date(cursorIndex);

    const {data: likedPostData,error: likedPostError}=await req.supabase.rpc("get_posts",{
        input_account_id: accountID,
        input_limit:limit,
        input_liked:true,
        input_liked_cursor:cursorIndex && new Date(cursorIndex).toISOString(),
    })
    if (likedPostError){
        return sendErrorResponse({res, statusCode:500, errorMessage:"Liked Posts Error: "+likedPostError.message});
    }
    //console.log("RPC result: ",likedPostData);
    if (!likedPostData.length){
        return sendSuccessResponse({res,data:[],nextCursor:{nextCursor:null}});
    }
    return handleJoinedResponse({accountID, fieldToExtractIDs:"owneraccountid",res, reqSupabase:req.supabase,
        data:likedPostData, nextCursor:{nextCursor: encodeURIComponent(likedPostData[likedPostData.length-1].likeat)}});
});

app.get("/bookmarks", attachSupabase, async(req,res)=>{
    const {accountID,cursorIndex=new Date().toISOString(),limit=20}=req.query;

    const {data: bookmarkData,error: bookmarkError}=await req.supabase.rpc("get_posts",{
        input_account_id: accountID,
        input_limit:limit,
        input_bookmarked:true,
        input_bookmark_cursor:cursorIndex
    })

    if (bookmarkError){
        return sendErrorResponse({res, statusCode:500, errorMessage:"Bookmark Posts Error: "+bookmarkError.message});
    }

    if (!bookmarkData.length){
        return sendSuccessResponse({res, data:[], nextCursor:{nextCursor:null}});
    }
    return handleJoinedResponse({accountID, fieldToExtractIDs:"owneraccountid",res, reqSupabase:req.supabase, 
        data:bookmarkData, 
        nextCursor: {nextCursor: encodeURIComponent(bookmarkData[bookmarkData.length-1].savedat)}});
});

app.get("/post/story", attachSupabase, async(req,res)=>{
    const {accountID, ownerAccountID, cursorIndex=new Date().toISOString(), limit=20}=req.query;

    const {data,error}=await req.supabase.rpc("get_stories",{
        input_account_id: accountID,
        input_owner_id: ownerAccountID,
        input_limit: limit,
        input_cursor_index: cursorIndex
    });

    if (error){
        return sendErrorResponse({res,statusCode:500,errorMessage:"Story Error: "+error.message});
    }

    if(!data.length){
       return sendSuccessResponse({res,data:[],nextCursor:{nextCursor:null}});
    }
    return handleJoinedResponse({accountID,fieldToExtractIDs:"owneraccountid",res, reqSupabase: req.supabase,
        data,nextCursor:{nextCursor: encodeURIComponent(data[data.length-1].createdat)}});
});

app.get("/searchhistory",attachSupabase, async(req,res)=>{
    const accountID=req.query.accountID;

    const {data,error}=await req.supabase.rpc("get_search_history",{
        input_account_id: accountID
    });
    if (error){
        return sendErrorResponse({res,statusCode:500,errorMessage:"Search History Error: "+error.message});
    }
    if (!data.length){
        return sendSuccessResponse({res,data:[]});
    }
    return handleJoinedResponse({accountID,fieldToExtractIDs:"accountid",res,reqSupabase:req.supabase,data});
    
});

app.get("/search/account",attachSupabase,async(req,res)=>{
    const {accountID,searchTerm,cursorFollowerCount,cursorAccountID,limit=50}=req.query;

    const {data,error}=await req.supabase.rpc("get_search_accounts",{
        input_account_id:accountID,
        input_search_term:searchTerm,
        input_cursor_follower_count:cursorFollowerCount,
        input_cursor_account_id: cursorAccountID,
        input_limit: limit
    });

    if (error){
        return sendErrorResponse({res,statusCode:500,errorMessage:"Search Account Error: "+error.message});
    } 

    if(!data.length){
        return sendSuccessResponse({res,data:[],nextCursor:{nextCursorFollowerCount:null,nextCursorAccountID:null}});
    }
    return handleJoinedResponse({accountID, fieldToExtractIDs:"accountid", res, reqSupabase:req.supabase,
        data, nextCursor: {nextCursorFollowerCount:data[data.length-1].followercount,
            nextCursorAccountID:data[data.length-1].accountid}});
});

app.get("/search/post",attachSupabase, async(req,res)=>{
    const {accountID,searchTerm,cursorIndex,limit=20}=req.query;

    if (!searchTerm){
        return sendErrorResponse({res, statsuCode:400, errorMessage:"searchTerm cannot be NULL"});
    }

    const{data,error}=await req.supabase.rpc("get_posts",{
        input_account_id: accountID,
        input_cursor_post_id: cursorIndex,
        input_limit: limit,
        input_search_term: searchTerm
    });

    if (error){
        return sendErrorResponse({res,statusCode:500,errorMessage:"Search Post Error: "+error.message});
    } 
    if(!data.length){
        return sendSuccessResponse({res,data:[],nextCursor:{nextCursor:null}});
    }
    return handleJoinedResponse({accountID,fieldToExtractIDs:"owneraccountid",res, reqSupabase:req.supabase,
        data,nextCursor:{nextCursor:data[data.length-1].postid}});
    
});

app.get("/comment",attachSupabase, async (req,res)=>{
    const {accountID, postID, cursorIndex=new Date().toISOString(),limit=20}=req.query;

    const {data,error}=await req.supabase.rpc("get_main_comments",{
        input_post_id: postID,
        input_limit:limit,
        input_cursor:cursorIndex
    });
    
    if (error){
        return sendErrorResponse({res,statusCode:500,errorMessage:`Comment Error: ${error.message}`});
    }

    if (!data.length){
        return sendSuccessResponse({res,data:[],nextCursor:{nextCursor:null}});
    }
    const {data:joinedData, error:joinedError}=await joinFleetDataForComment(accountID,data,req.supabase);
    if (joinedError){
        return sendErrorResponse({res,statusCode:500,errorMessage:`Join Data Error: ${joinedError.message}`});
    }
    return sendSuccessResponse({res,data:joinedData,nextCursor:{nextCursor:encodeURIComponent(data[data.length-1].createdat)}});

})

app.get("/comment/reply",attachSupabase, async (req,res)=>{
    const {accountID,mainCommentID,cursorIndex=new Date().toISOString(),limit=5}=req.query;

    const {data,error}=await req.supabase.rpc("get_comment_replies",{
        input_main_comment_id:mainCommentID,
        input_cursor:cursorIndex,
        input_limit:limit
    })
    if (error){
        return sendErrorResponse({res,statusCode:500,errorMessage:`Reply Data Error: ${error.message}`});
    }
    if (!data.length){
        return sendSuccessResponse({res,data:[],nextCursor:{nextCursor:null}});
    }
    const {data:joinedData, error:joinedError}=await joinFleetDataForComment(accountID,data,req.supabase);
    if (joinedError){
        return sendErrorResponse({res,statusCode:500,errorMessage:`Join Data Error: ${joinedError.message}`});
    }
    return sendSuccessResponse({res,data:joinedData,nextCursor:{nextCursor:encodeURIComponent(data[data.length-1].createdat)}});
})

app.get("/public-url",attachSupabase, async (req,res)=>{
    const {bucketName,mediaPath}=req.query;

    const {data,error}=await req.supabase.storage.from(bucketName).getPublicUrl(mediaPath);
        
    if (error){
        return sendErrorResponse({res,statusCode:500,errorMessage:`Unable to get publicUrl: ${error.message}`});
    };
    return sendSuccessResponse({res,data:{publicUrl:data.publicUrl}});
    
})






