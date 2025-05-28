import { supabase } from '../supabase-admin.js';

async function assignTrackIDsWithExceptions() {
  const EXCEPTION_TRACK_IDS = {
    154: 1,
    155: 7,
    156: 10,
    157: 1,
    158: 2,
    159: 3,
    160: 4,
    161: 2
  };

  // Fetch all video media records ordered by postID then mediaID
  const { data: videos, error } = await supabase
    .from('Media')
    .select('mediaID, postID')
    .in('mediaType', ['Video', 'video']) // handle lowercase typo just in case
    .order('postID', { ascending: true }) // ensure consistent ordering
    .order('mediaID', { ascending: true });

  if (error) {
    console.error('Error fetching Video media:', error);
    return;
  }

  let trackID = 1;

  for (const video of videos) {
    let assignedTrackID;

    if (EXCEPTION_TRACK_IDS.hasOwnProperty(video.postID)) {
      assignedTrackID = EXCEPTION_TRACK_IDS[video.postID];
    } else {
      assignedTrackID = trackID;
      trackID = trackID < 10 ? trackID + 1 : 1;
    }

    const { error: updateError } = await supabase
      .from('Media')
      .update({ trackID: assignedTrackID })
      .eq('mediaID', video.mediaID);

    if (updateError) {
      console.error(`Error updating mediaID ${video.mediaID} (postID ${video.postID}):`, updateError);
    }
  }

  console.log('✅ Finished assigning trackIDs to video media.');
}

assignTrackIDsWithExceptions();
