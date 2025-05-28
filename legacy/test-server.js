import express from "express";
import cors from "cors";
import {supabase} from "../supabase-client.js";
import dotenv from "dotenv";
import sendPostData from "../temporary-client.js";
dotenv.config();
const app=express();
const PORT=3000;

//middleware
app.use(cors());
app.use(express.json());

//external routes


//routes
app.get("/",async(req,res)=>{
    res.send("Hello Vibe-Express-App");
});

app.get("/p", async(req,res)=>{
    const ownerAccountID=req.query.ownerAccountID;
    const text=req.query.text;
    const postType=req.query.postType;
    const expiresAt=req.query.expireAt;
    //const likesCount=req.query.likesCount===
    if (!ownerAccountID || !text || !postType){
        res.json({errorMessage:"ownerAccountID OR text OR postType cannot be null"});
        return;
    }
    const postData={ownerAccountID: ownerAccountID, text: text, postType: postType, expiresAt: expiresAt};
    const {error}=await supabase.from("Post").insert(postData).single();
    if (error){
        res.send(`Error: ${error.message}`)
    } else{
        res.send("Successfully saved post data.")
    }
});

app.get("/callclient",async(req,res)=>{
    sendPostData();
    res.send("Called client");
});
app.post("/postinsert", async(req,res)=>{
    const {ownerAccountID,text,postType}=req.body;
    const {error}=await supabase.from("Post").insert({
        ownerAccountID,
        text,
        postType
    }).single();
    if (error){
        res.json(`Error: ${error.message}`)
    } else{
        res.json("Successfully saved post data.")
    }
});

app.get("/post",async(req,res)=>{
    const postType=req.query.postType;
    const ownerAccountID=req.query.ownerAccountID;
    if (!postType && !ownerAccountID){
        const {data,error}=await supabase.from("Post").select("*");
        if (error){
            res.json({errorMessage: `Error: ${error.message}`});
        } else{
            res.json(data);
        }
        return;
    }
    if (postType && ownerAccountID){
        res.json({errorMessage: "Specify only one filter: postType OR ownerAccountID"});
        return;
    } 
    if (postType){
        const {data,error}=await supabase.from("Post").select("*").eq("postType",postType);
        if (error){
            res.json({errorMessage: `Error: ${error.message}`});
        } else {
            res.json(data);
        }
        return;
    }
    if (ownerAccountID){
        const {data,error}=await supabase.from("Post").select("*").eq("ownerAccountID",ownerAccountID);
        if (error){
            res.json({errorMessage: `Error: ${error.message}`});
        } else {
            res.json(data);
        }
        return;
    }
})

//starting the server
app.listen(PORT, ()=>{
    console.log(`Server is listening on port ${PORT}`);
});
