import { faker } from '@faker-js/faker';
import {supabase} from "../supabase-admin.js";

// Avatar mapping
const avatarMap = [
  ...Array.from({ length: 5 }, (_, i) => `avatar${i + 1}.jpg`),      // female
  ...Array.from({ length: 5 }, (_, i) => `avatar${i + 6}.jpg`),      // male
  ...Array.from({ length: 5 }, (_, i) => `avatar${i + 11}.jpg`),     // female
  ...Array.from({ length: 5 }, (_, i) => `avatar${i + 16}.jpg`),     // male
];

async function createMockUsers() {
  for (let i = 0; i < 20; i++) {
    const avatarPath = avatarMap[i];
    const gender = [0,1,2,3,4,10,11,12,13,14].includes(i) ? 'female' : 'male';
    const email = `user${i + 1}@example.com`;
    const password = 'Password123';
    const displayName = faker.person.fullName({sex:gender});
    const nameArray = displayName.split(" ");
    const baseUsername = nameArray.join('').toLowerCase();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const username = `${baseUsername}${randomSuffix}`;
    const profileDescription = faker.person.bio();

    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (signUpError) {
      console.error(`Sign-up error for ${email}: ${signUpError.message}`);
      continue;
    }

    const accountID = authData.user.id;

    const { error: profileError } = await supabase.from('Profile').insert({
      accountID,
      username,
      avatarPath,
      displayName,
      profileDescription,
    });

    if (profileError) {
      console.error(`Profile insert error for ${email}: ${profileError.message}`);
    }
  }

  console.log('All users created and profiles populated.');
}

createMockUsers();
