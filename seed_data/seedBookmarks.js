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

// Fetch all posts once to assign bookmarks
const { data: posts, error: postsError } = await supabase.from('Post').select('postID');
if (postsError) {
  console.error('Failed to fetch posts:', postsError);
  process.exit(1);
}

const postIDs = posts.map(p => p.postID);

const bookmarks = [];
let userWithZeroBookmarksChosen = false;

for (const userID of userMap) {
  // Decide collections count (0-3)
  const collectionCount = faker.number.int({ min: 0, max: 3 });

  // Generate collection names if any
  let collections = [];
  if (collectionCount > 0) {
    const possibleCollections = ['Favorites', 'Read Later', 'Work', 'Travel', 'Personal', 'Recipes', 'Ideas'];
    collections = faker.helpers.arrayElements(possibleCollections, collectionCount);
  }

  // Decide number of bookmarks (0-20)
  // Ensure at least one user has 0 bookmarks
  let bookmarkCount;
  if (!userWithZeroBookmarksChosen) {
    if (faker.datatype.boolean() && faker.datatype.boolean()) { 
      bookmarkCount = 0;
      userWithZeroBookmarksChosen = true;
    } else {
      bookmarkCount = faker.number.int({ min: 1, max: 20 });
    }
  } else {
    bookmarkCount = faker.number.int({ min: 1, max: 20 });
  }

  // Create bookmarks
  const bookmarkedPosts = new Set();
  for (let i = 0; i < bookmarkCount; i++) {
    let postID;
    do {
      postID = faker.helpers.arrayElement(postIDs);
    } while (bookmarkedPosts.has(postID));
    bookmarkedPosts.add(postID);

    // Only set collectionName if collections exist
    const bookmarkData = {
      ownerAccountID: userID,
      postID,
    };
    if (collections.length > 0) {
      bookmarkData.collectionName = faker.helpers.arrayElement(collections);
    }

    bookmarks.push(bookmarkData);
  }
}

// Insert bookmarks into DB
const { error } = await supabase.from('Bookmarks').insert(bookmarks);
if (error) {
  console.error('Error inserting bookmarks:', error);
} else {
  console.log(`✅ Inserted ${bookmarks.length} bookmarks`);
}
