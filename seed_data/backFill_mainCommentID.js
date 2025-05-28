import {supabase} from"../supabase-admin.js";

async function populateMainCommentIDs() {
  try {
    const { data: mainComments, error: mainCommentsError } = await supabase
      .from('Comments')
      .select('commentID')
      .eq('commentType', 'Main');

    if (mainCommentsError) throw mainCommentsError;

    for (const mainComment of mainComments) {
      console.log(`Processing main comment: ${mainComment.commentID}`);
      
      const replies = await findAllReplies(mainComment.commentID);
      
      for (const reply of replies) {
        const { error: updateError } = await supabase
          .from('Comments')
          .update({ mainCommentID: mainComment.commentID })
          .eq('commentID', reply.commentID);

        if (updateError) throw updateError;
        
        console.log(`Updated comment ${reply.commentID} with mainCommentID: ${mainComment.commentID}`);
      }
    }

    console.log('Finished populating mainCommentIDs for all comments');
  } catch (error) {
    console.error('Error populating mainCommentIDs:', error);
  }
}

// Recursive function to find all replies (direct and nested) of a comment
async function findAllReplies(commentID, allReplies = []) {
  // Get direct replies
  const { data: directReplies, error } = await supabase
    .from('Comments')
    .select('commentID, parentCommentID')
    .eq('parentCommentID', commentID);

  if (error) throw error;

  if (directReplies.length === 0) {
    return allReplies;
  }

  allReplies.push(...directReplies);

  // Recursively find replies of these replies
  for (const reply of directReplies) {
    await findAllReplies(reply.commentID, allReplies);
  }

  return allReplies;
}

populateMainCommentIDs();