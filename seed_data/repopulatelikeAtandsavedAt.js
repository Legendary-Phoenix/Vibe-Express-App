import { supabase } from '../supabase-admin.js';

function getRandomTimestampWithinLastTwoDays() {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const randomTime = new Date(twoDaysAgo.getTime() + Math.random() * (now.getTime() - twoDaysAgo.getTime()));
  return randomTime.toISOString();
}

async function updatePostLikes() {
  const { data: postLikes, error } = await supabase.from('Post Likes').select('accountID, postID');

  if (error) {
    console.error('Error fetching Post Likes:', error);
    return;
  }

  for (const like of postLikes) {
    const likeAt = getRandomTimestampWithinLastTwoDays();

    const { error: updateError } = await supabase
      .from('Post Likes')
      .update({ likeAt })
      .eq('accountID', like.accountID)
      .eq('postID', like.postID);

    if (updateError) {
      console.error(`Error updating like for accountID ${like.accountID}, postID ${like.postID}:`, updateError);
    }
  }

  console.log('Finished updating Post Likes.');
}

async function updateBookmarks() {
  const { data: bookmarks, error } = await supabase.from('Bookmarks').select('ownerAccountID, postID');

  if (error) {
    console.error('Error fetching Bookmarks:', error);
    return;
  }

  for (const bookmark of bookmarks) {
    const savedAt = getRandomTimestampWithinLastTwoDays();

    const { error: updateError } = await supabase
      .from('Bookmarks')
      .update({ savedAt })
      .eq('ownerAccountID', bookmark.ownerAccountID)
      .eq('postID', bookmark.postID);

    if (updateError) {
      console.error(`Error updating bookmark for accountID ${bookmark.ownerAccountID}, postID ${bookmark.postID}:`, updateError);
    }
  }

  console.log('Finished updating Bookmarks.');
}

// Run both updates
async function runUpdates() {
  await updatePostLikes();
  await updateBookmarks();
}

runUpdates();
