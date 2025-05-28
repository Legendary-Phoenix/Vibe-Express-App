import joinFleetData from "./joinFleetData.js";

export function sendSuccessResponse({res, data, nextCursor={}}) {
    const responseData={
        success:true,
        ...nextCursor,
        data
    };
    res.status(200).json(responseData);
}

export function sendErrorResponse({res, statusCode, errorMessage}){
    res.status(statusCode).json({
        success:false,
        errorMessage
    });
}

export async function handleJoinedResponse({accountID,fieldToExtractIDs, res, reqSupabase, data,nextCursor={}}){
    const { data: joinedData, error: joinedError } = 
    await joinFleetData(accountID, data, fieldToExtractIDs, reqSupabase);
    if (joinedError) {
        return sendErrorResponse({res, statusCode:500, errorMessage:`Join Data Error: ${joinedError.message}`});
    }
    
    return sendSuccessResponse({res,data:joinedData,nextCursor});
}