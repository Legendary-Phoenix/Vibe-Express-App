import express from "express";
import {supabase} from "../supabase-public.js";
import { sendErrorResponse, sendSuccessResponse } from "../utils/responseUtils.js";

const router=express.Router();

//register new user
router.post("/register",async (req,res)=>{
    const {email,password}=req.body;
    const {data,error}=await supabase.auth.signUp({
        email,
        password
    });

    if (error){
        return sendErrorResponse({res,statusCode:401,errorMessage: `Failed to register: ${error.message}`})
    }
    return sendSuccessResponse({res,data:{user:data.user}});
});

//login new user

router.post("/login",async(req,res)=>{
    const {email,password}=req.body;
    const {data,error}=await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error){
        return sendErrorResponse({res,statusCode:401,errorMessage:`Failed to sign up: ${error.message}`});
    }
    const response={
        user: data.user,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token
    };
    return sendSuccessResponse({res,data:response});
});

export default router;