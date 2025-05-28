import {supabase} from "../supabase-admin.js";
import {randomInt} from "crypto";


const fallbackGeneralTerms = [
  "sunset", "ocean", "vibe", "coffee", "travel", "books", "mindset",
  "fitness", "art", "design", "chill", "coding", "hiking", "startup"
];

function getRandomGeneralTerm() {
  const index = Math.floor(Math.random() * fallbackGeneralTerms.length);
  return fallbackGeneralTerms[index];
}

async function populateSearchHistory() {
  // Fetch all account IDs and usernames
  const { data: users, error: userError } = await supabase
    .from('Profile')
    .select('accountID, username');

  if (userError) {
    console.error("Failed to fetch users:", userError.message);
    return;
  }

  for (const user of users) {
    const totalSearches = randomInt(3, 8); // 3 to 7
    const accountSearchCount = 2 + randomInt(0, totalSearches - 1); // At least 2

    const usedUsernames = new Set();
    const historyEntries = [];

    for (let i = 0; i < accountSearchCount; i++) {
      let targetUser;
      do {
        targetUser = users[Math.floor(Math.random() * users.length)];
      } while (targetUser.accountID === user.accountID || usedUsernames.has(targetUser.username));

      usedUsernames.add(targetUser.username);

      historyEntries.push({
        accountID: user.accountID,
        typeOfSearch: "Account",
        searchTerm: targetUser.username
      });
    }

    for (let i = accountSearchCount; i < totalSearches; i++) {
      historyEntries.push({
        accountID: user.accountID,
        typeOfSearch: "General",
        searchTerm: getRandomGeneralTerm()
      });
    }

    const { error: insertError } = await supabase
      .from("Search History")
      .insert(historyEntries);

    if (insertError) {
      console.error(`Insert failed for user ${user.accountID}:`, insertError.message);
    } else {
      console.log(`Inserted ${historyEntries.length} search records for ${user.username}`);
    }
  }

  console.log("✅ Finished populating Search History.");
}

populateSearchHistory();
