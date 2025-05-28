import { supabase } from '../supabase-admin.js';
import { faker } from '@faker-js/faker';


// Replace with your actual user UUIDs
const userMap = [
  'e7f5cb37-f7a0-442d-b11c-03d4b25be948', '24f2af2e-1243-4998-a0a9-a74361a00aee', '75793398-29b7-4b6b-84fb-5161a67ce540', 
  'ed73f19b-d637-4936-adc4-7f274106f97f', '9452ea5b-890b-4abb-88de-a66134f991c5',
  'e27333f0-b85c-4fbe-8873-c8827048011c', 'a358c171-7d16-4bf5-814c-4dd2673dad29', '60e66cc9-0e5f-4661-a496-47760372970a', 
  '747e1a1c-fa20-4951-8718-205cf8d3810d', 'fbc822a8-c41a-4557-b589-1cce204ec711',
  'c97bcd15-cceb-4793-bebc-98dbe0d8aff4', '4cce5200-5c38-4d0e-9f39-a2b6eea05197', 'ac8de4b3-365a-4ca7-a1d4-883ce3393447', 
  '48408731-d553-4700-ad5e-09778df3510e', '23c6d55c-4120-49a7-9aa0-13a0e5984cae', '908cd478-58ca-4455-a147-24af0e7f2f41',
  '244058d0-17ae-4023-a185-499a83c4d0d0', '677012d0-feb8-4803-b4fe-5030b5e2bea9', 'e997e343-1dc8-48fd-a14e-9c022bfdf98d', 
  'bd9024bf-a8e5-4fb3-8413-4a12d6e55889',
];

// Available story media
const storyMedia = [
  { file: 'image1-placeholder.jpg', type: 'image', folder: 'images', aspectRatio: '1:1', cropOption: 'Fit' },
  { file: 'image2-placeholder.jpg', type: 'image', folder: 'images', aspectRatio: '9:16', cropOption: 'Fill' },
  { file: 'video1-placeholder.mp4', type: 'video', folder: 'videos', aspectRatio: '9:16', cropOption: 'Fill' },
  { file: 'video2-placeholder.mp4', type: 'video', folder: 'videos', aspectRatio: '9:16', cropOption: 'Fill' },
  { file: 'video3-placeholder.mp4', type: 'video', folder: 'videos', aspectRatio: '9:16', cropOption: 'Fill' },
];

async function insertPostAndMedia(postData, mediaDataList) {
  const { data: postResult, error: postError } = await supabase
    .from('Post')
    .insert([postData])
    .select('postID')
    .single();

  if (postError) {
    console.error('❌ Post insert error:', postError);
    return;
  }

  const postID = postResult.postID;

  const mediaInserts = mediaDataList.map(media => ({ ...media, postID }));

  const { error: mediaError } = await supabase
    .from('Media')
    .insert(mediaInserts);

  if (mediaError) {
    console.error('❌ Media insert error:', mediaError);
  }
}

function getRandomMediaSet() {
  const shuffled = storyMedia.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

async function insertStoryPosts() {
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  for (const accountID of userMap) {
    const post = {
      ownerAccountID: accountID,
      postType: 'Story',
      expiresAt,
      likesCount: faker.number.int({ min: 0, max: 5 }), // Random like count
    };

    const selectedMedia = getRandomMediaSet();

    const mediaEntries = selectedMedia.map(media => ({
      mediaType: media.type,
      mediaPath: `story/${media.folder}/${media.file}`,
      mediaAspectRatio: media.aspectRatio,
      renderAspectRatio: media.aspectRatio,
      cropOption: media.cropOption,
    }));

    await insertPostAndMedia(post, mediaEntries);
  }

  console.log('✅ Story posts and media inserted!');
}

insertStoryPosts();
