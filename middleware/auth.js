import getSupabaseForUser from "../utils/getSupabaseForUser.js";
import { sendErrorResponse } from "../utils/responseUtils.js";

export const attachSupabase=(req,res,next)=>{
    const authHeader=req.headers.authorization || "";
    const token=authHeader.split(" ")[1];
    if (!token){
        return sendErrorResponse({res,statusCode:401,errorMessage:`Missing or invalid token`});
    }

    req.supabase=getSupabaseForUser(token);
    next();
}