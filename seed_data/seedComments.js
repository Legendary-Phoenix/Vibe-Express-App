import { faker } from '@faker-js/faker';
import { supabase } from '../supabase-admin.js';

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

const emojiList = [':heart:', ':fire:', ':laughing:', ':clap:', ':thumbsup:', ':star:', ':sunglasses:', ':smile:', ':thinking:', ':sob:'];

function generateCommentText() {
  const type = faker.helpers.arrayElement(['text', 'emoji', 'both']);
  const text = faker.lorem.sentence();
  const emoji = faker.helpers.arrayElement(emojiList);

  if (type === 'text') return text;
  if (type === 'emoji') return emoji;
  return `${text} ${emoji}`;
}

function addMinutesToDate(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

async function generateComments() {
  const { data: posts, error } = await supabase.from('Post')
                                .select('postID, createdAt')
  if (error) {
    console.error('Failed to fetch posts:', error);
    return;
  }

  for (const post of posts) {
    const { postID, createdAt: postCreatedAt } = post;
    const comments = [];
    let timestamp = new Date(postCreatedAt);

    const mainCommentIDs = [];
    const replyCommentIDs = [];
    const minMainComments = faker.number.int({ min: 10, max: 15 });

    // 10+ main comments
    for (let i = 0; i < minMainComments; i++) {
      timestamp = addMinutesToDate(timestamp, 2);
      const comment = {
        postID,
        commenterAccountID: faker.helpers.arrayElement(userMap),
        commentType: 'Main',
        text: generateCommentText(),
        createdAt: timestamp.toISOString(),
        likesCount: faker.number.int({ min: 0, max: 20 }),
        edited: faker.helpers.arrayElement([true, false]),
      };
      comments.push(comment);
    }

    const insertedMain = await supabase.from('Comments').insert(comments).select('commentID');
    if (insertedMain.error) {
      console.error('Error inserting main comments:', insertedMain.error);
      continue;
    }

    const mainIDs = insertedMain.data.map(c => c.commentID);
    mainCommentIDs.push(...mainIDs);

    const subComments = [];
    timestamp = addMinutesToDate(timestamp, 2);

    // Add 2 main comments with 5+ replies
    for (let i = 0; i < 2; i++) {
      const parentID = mainCommentIDs[i];
      for (let j = 0; j < 5; j++) {
        timestamp = addMinutesToDate(timestamp, 2);
        subComments.push({
          postID,
          commenterAccountID: faker.helpers.arrayElement(userMap),
          commentType: 'Reply',
          parentCommentID: parentID,
          text: generateCommentText(),
          createdAt: timestamp.toISOString(),
          likesCount: faker.number.int({ min: 0, max: 20 }),
          edited: faker.helpers.arrayElement([true, false]),
        });
      }
    }

    // Add replies to at least 3 sub-comments
    const insertedSubs = await supabase.from('Comments').insert(subComments).select('commentID');
    if (insertedSubs.error) {
      console.error('Error inserting replies:', insertedSubs.error);
      continue;
    }

    const subIDs = insertedSubs.data.map(c => c.commentID);
    replyCommentIDs.push(...subIDs);

    const nestedReplies = [];
    for (let i = 0; i < 3 && i < replyCommentIDs.length; i++) {
      timestamp = addMinutesToDate(timestamp, 2);
      nestedReplies.push({
        postID,
        commenterAccountID: faker.helpers.arrayElement(userMap),
        commentType: 'Reply',
        parentCommentID: replyCommentIDs[i],
        text: generateCommentText(),
        createdAt: timestamp.toISOString(),
        likesCount: faker.number.int({ min: 0, max: 20 }),
        edited: faker.helpers.arrayElement([true, false]),
      });
    }

    if (nestedReplies.length > 0) {
      const nestedResult = await supabase.from('Comments').insert(nestedReplies);
      if (nestedResult.error) {
        console.error('Error inserting nested replies:', nestedResult.error);
      }
    }
  }
}

generateComments();
