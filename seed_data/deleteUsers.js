import {supabase} from "./supabase-admin.js";

async function deleteAllUsers() {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers({ perPage: 100 });
  if (listError) {
    console.error('Failed to list users:', listError);
    return;
  }

  for (const user of users.users) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error(`Failed to delete ${user.email}:`, deleteError);
    } else {
      console.log(`Deleted ${user.email}`);
    }
  }

  console.log('✅ All users deleted.');
}

deleteAllUsers();

