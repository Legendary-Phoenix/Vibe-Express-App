import { supabase } from '../supabase-admin.js';

function getRandomCount(max = 12) {
  return Math.floor(Math.random() * (max + 1)); // 0 to max inclusive
}

async function updatePostCounts() {
  const { data: posts, error } = await supabase.from('Post').select('postID');

  if (error) {
    console.error('Error fetching Post records:', error);
    return;
  }

  for (const post of posts) {
    const likesCount = getRandomCount();
    const sharesCount = getRandomCount();

    const { error: updateError } = await supabase
      .from('Post')
      .update({ likesCount, sharesCount })
      .eq('postID', post.postID);

    if (updateError) {
      console.error(`Error updating postID ${post.postID}:`, updateError);
    }
  }

  console.log('Finished updating Post table.');
}

updatePostCounts();
