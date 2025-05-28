
async function joinFleetForComment(accountID, data,reqSupabase) {
  const accountIDs = new Set();

  data.forEach(d => accountIDs.add(d.commenteraccountid));
  //console.log(`Account IDS for main: ${accountIDs}`);

  data.forEach(d => {
    if (Array.isArray(d.replies)) {
      d.replies.forEach(reply => {
        accountIDs.add(reply.commenteraccountid);
      });
    }
  });

  const uniqueIDs = Array.from(accountIDs);

  const { data: fleetData, error: fleetError } = await reqSupabase.rpc("get_fleet_data", {
    input_account_ids: uniqueIDs,
    input_viewer_id: accountID
  });

  if (fleetError) {
    return { data: null, error: fleetError };
  }

  const fleetMap = new Map(fleetData.map(f => [f.accountid, f]));

  const dataWithFleets = data.map(d => ({
    ...d,
    fleet: fleetMap.get(d.commenteraccountid) || null,
    replies: Array.isArray(d.replies)
      ? d.replies.map(reply => ({
          ...reply,
          fleet: fleetMap.get(reply.commenteraccountid) || null
        }))
      : []
  }));

  return { data: dataWithFleets, error: null };
}

export default joinFleetForComment;
