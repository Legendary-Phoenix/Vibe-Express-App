
async function joinFleetData(accountID, data, fieldToExtractIDs,reqSupabase){
    const accountIDs=[...new Set(data.map(d=>d[fieldToExtractIDs]))];
    //console.log("Extracted account IDs: ",accountIDs);
    const{data: fleetData,error: fleetError}= await reqSupabase.rpc("get_fleet_data",{
        input_account_ids: accountIDs,
        input_viewer_id: accountID
    });
    if (fleetError){
        return {data:null,error:fleetError};
    }
    const fleetMap= new Map(fleetData.map(f=>[f.accountid, f]));
    const dataWithFleets=data.map(d=>({
        ...d,
        fleet: fleetMap.get(d[fieldToExtractIDs]) || null
    }));
    return {data: dataWithFleets, error:null};
    //console.log("Fleet Data: ",fleetData);
    //console.log("Map: ",fleetMap);
    //console.log("Post with fleets:",postsWithFleets);
}

export default joinFleetData;