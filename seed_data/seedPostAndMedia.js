import {supabase} from "../supabase-admin.js";
import { faker } from '@faker-js/faker';


// User map: replace with actual UUIDs
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

// Feed image groupings
const imageGroups = [
  ['image1.jpg', 'image2.jpg'], ['image3.jpg', 'image4.jpg', 'image5.jpg'], ['image6.jpg'],
  ['image7.jpg', 'image8.jpg'], ['image9.jpg'], ['image10.jpg'], ['image11.jpg'], ['image12.jpg'],
  ['image13.jpg', 'image14.jpg'], ['image15.jpg'], ['image16.jpg', 'image17.jpg', 'image18.jpg'],
  ['image19.jpg'], ['image20.jpg'], ['image21.jpg'], ['image22.jpg']
];


// Feed video filenames
const feedVideoFiles = Array.from({ length: 8 }, (_, i) => `video${i + 1}.mp4`);
// Reel video filenames
const reelVideoFiles = Array.from({ length: 22 }, (_, i) => `video${i + 1}.mp4`);


async function insertPostAndMedia(postData, mediaDataList, trackData) {
  const { data: postResult, error: postError } = await supabase.from('Post').insert([postData]).select('postID').single();
  if (postError) {
    console.error('Post insert error:', postError);
    return;
  }

  const postID = postResult.postID;

  const mediaInserts = mediaDataList.map(media => ({ ...media, postID }));
  const { error: mediaError } = await supabase.from('Media').insert(mediaInserts);
  if (mediaError) {
    console.error('Media insert error:', mediaError);
  }

  if (trackData){
    const trackInsert={...trackData,postID};
    const {error: postAudioError}= await supabase.from("Post Audio").insert(trackInsert).single();
    if (postAudioError){
      console.error("Post Audio insert error:", postAudioError)
    }
  }
}

function generateDescription() {
  return faker.lorem.paragraphs(3);
}

async function createPosts() {
  // Ensure each user gets at least 1 reel post
  for (let i = 0; i < 20; i++) {
    const ownerAccountID = userMap[i];
    const mediaPath = `reels/${reelVideoFiles[i]}`;
    let trackID;

    const post = {
      ownerAccountID,
      postType: 'Reel',
      description: generateDescription(),
    };

    const media = [{
      mediaType: 'Video',
      mediaPath,
      mediaAspectRatio: '9:16',
      renderAspectRatio: '9:16',
      cropOption: 'Fill',
    }];

    if ((i+1)>10){
      trackID=(i-10)+1;
    } else{
      trackID=i+1;
    }

    const track={trackID};

    await insertPostAndMedia(post, media, track);
  }

  // Remaining 2 reel posts for any users
  for (let i = 20; i < 22; i++) {
    const ownerAccountID = userMap[Math.floor(Math.random() * 20)];
    const mediaPath = `reels/${reelVideoFiles[i]}`;

    const post = {
      ownerAccountID,
      postType: 'Reel',
      description: generateDescription(),
    };

    const media = [{
      mediaType: 'Video',
      mediaPath,
      mediaAspectRatio: '9:16',
      renderAspectRatio: '9:16',
      cropOption: 'Fill',
    }];

    const trackID=(i-20)+1;
    const track={trackID};

    await insertPostAndMedia(post, media, track);
  }

  // Merge feed image posts (15) + feed video posts (8) = 23
  const feedPosts = [];

  // 15 feed image posts
  for (let i = 0; i < imageGroups.length; i++) {
    const images = imageGroups[i];
    feedPosts.push({
      type: 'Image',
      mediaGroup: images,
    });
  }

  // 8 feed video posts
  for (let i = 0; i < feedVideoFiles.length; i++) {
    const video = feedVideoFiles[i];
    feedPosts.push({
      type: 'Video',
      mediaGroup: [video],
    });
  }
  const videoToTrackMap=
    {
      video1: 1,
      video2: 7,
      video3: 10,
      video4: 1,
      video5: 2,
      video6: 3,
      video7: 4,
      video8: 2
    };
  
  // Ensure each user gets at least 1 feed post
  for (let i = 0; i < 20; i++) {
    const { type, mediaGroup } = feedPosts[i];
    const ownerAccountID = userMap[i];

    const post = {
      ownerAccountID,
      postType: 'Feed',
      description: generateDescription(),
    };

    const media = mediaGroup.map(mediaFile => ({
      mediaType: type,
      mediaPath: `feed/${type === 'Image' ? 'images' : 'videos'}/${mediaFile}`,
      mediaAspectRatio: type === 'Image' ? '1:1' : '9:16',
      renderAspectRatio: type === 'Image' ? '1:1' : '4:5',
      cropOption: type === 'Image' ? 'Fit' : 'Fill',
    }));

    let track = null;
    if (type === 'Video') {
      const videoFileName = mediaGroup[0]; // only 1 per video feed post
      const videoKey = videoFileName.replace('.mp4', ''); // "video1" etc.
      const trackID = videoToTrackMap[videoKey];
      if (trackID) {
        track = { trackID };
      }
    }

    await insertPostAndMedia(post, media, track);
  }

  // Remaining 3 feed posts for any users
  for (let i = 20; i < feedPosts.length; i++) {
    const { type, mediaGroup } = feedPosts[i];
    const ownerAccountID = userMap[Math.floor(Math.random() * 20)];

    const post = {
      ownerAccountID,
      postType: 'Feed',
      description: generateDescription(),
    };

    const media = mediaGroup.map(mediaFile => ({
      mediaType: type,
      mediaPath: `feed/${type === 'image' ? 'images' : 'videos'}/${mediaFile}`,
      mediaAspectRatio: type === 'image' ? '1:1' : '9:16',
      renderAspectRatio: type === 'image' ? '1:1' : '4:5',
      cropOption: type === 'image' ? 'fit' : 'fill',
    }));

    let track = null;
    if (type === 'Video') {
      const videoFileName = mediaGroup[0];
      const videoKey = videoFileName.replace('.mp4', '');
      const trackID = videoToTrackMap[videoKey];
      if (trackID) {
        track = { trackID };
      }
    }

    await insertPostAndMedia(post, media, track);
  }

  console.log('✅ All posts and media inserted with full user distribution!');
}

createPosts();

