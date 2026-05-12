// ============================================================
// VibesDoc — SEED USERS
// ============================================================
// Run: node scripts/seed.js
// Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
//
// What this does:
//   1. Creates auth.users via Supabase admin API
//   2. Two triggers fire automatically:
//        - trg_on_auth_user_created (boilerplate) -> creates user_profiles row
//        - on_auth_user_created_workspace (Phase H) -> creates workspaces row
//   3. Waits 800ms for triggers to complete
//   4. If user is super_admin, updates user_profiles.role
//   5. Verifies BOTH user_profiles AND workspaces rows exist
//   6. Prints workspace username (auto-generated) for login info
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================
// 📋 DATA USER — GANTI SESUAI KEBUTUHAN
// ============================================================
const userList = [
  {
    full_name: "Administrator",
    email: "admin@vibesdoc.com",
    password: "Admin@2026",
    role: "super_admin",
  },
  {
    full_name: "Demo User",
    email: "demo@vibesdoc.com",
    password: "Demo@2026",
    role: "user",
  },
];

// ============================================================
// 🚀 CREATE USER + verify both triggers fired
// ============================================================
async function createUser(userData) {
  try {
    console.log(`\n📝 Processing: ${userData.full_name} (${userData.email})`);

    // Check if auth user already exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existing = users.find((u) => u.email === userData.email);

    if (existing) {
      console.log(`   ⏭️  Auth user sudah ada (ID: ${existing.id})`);

      // Verify profile exists
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id, role, full_name")
        .eq("id", existing.id)
        .single();

      // Verify workspace exists (Phase H)
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("username, display_name")
        .eq("user_id", existing.id)
        .single();

      // Update role if needed
      if (profile && profile.role !== userData.role) {
        await supabase
          .from("user_profiles")
          .update({ role: userData.role, full_name: userData.full_name })
          .eq("id", existing.id);
        console.log(`   🔄 Role diupdate ke: ${userData.role}`);
      }

      // Backfill missing profile (shouldn't happen with triggers but defensive)
      if (!profile) {
        await supabase
          .from("user_profiles")
          .insert({ id: existing.id, full_name: userData.full_name, role: userData.role });
        console.log(`   ✅ Profile dibuat untuk existing user`);
      }

      // Backfill missing workspace (shouldn't happen but defensive)
      if (!workspace) {
        const baseUsername = userData.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
        await supabase
          .from("workspaces")
          .insert({
            user_id: existing.id,
            username: `${baseUsername}-${existing.id.slice(0, 6)}`,
            display_name: userData.full_name,
          });
        console.log(`   ✅ Workspace di-backfill`);
      }

      console.log(`   👤 Profile: ${profile?.full_name ?? "N/A"} (${profile?.role ?? "N/A"})`);
      console.log(`   🌐 Workspace: @${workspace?.username ?? "N/A"}`);

      return {
        status: "skipped",
        ...userData,
        workspace_username: workspace?.username,
      };
    }

    // ── Create NEW auth user ────────────────────────────────
    console.log(`   🔐 Membuat auth user...`);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: { full_name: userData.full_name },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("No user data returned");
    console.log(`   ✅ Auth user dibuat: ${authData.user.id}`);

    // Wait for BOTH triggers to complete
    //   - trg_on_auth_user_created     -> user_profiles row
    //   - on_auth_user_created_workspace -> workspaces row
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Update role to super_admin if needed (trigger default = 'user')
    if (userData.role === "super_admin") {
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ role: "super_admin", full_name: userData.full_name })
        .eq("id", authData.user.id);
      if (updateError) throw updateError;
      console.log(`   👑 Role diset ke super_admin`);
    }

    // Verify BOTH rows exist after triggers
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id, role, full_name")
      .eq("id", authData.user.id)
      .single();

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("username, display_name")
      .eq("user_id", authData.user.id)
      .single();

    if (!profile) {
      console.warn(`   ⚠️  user_profiles row tidak terdeteksi setelah trigger!`);
    } else {
      console.log(`   👤 Profile created: ${profile.full_name} (${profile.role})`);
    }

    if (!workspace) {
      console.warn(`   ⚠️  workspaces row tidak terdeteksi setelah trigger!`);
    } else {
      console.log(`   🌐 Workspace created: @${workspace.username}`);
    }

    console.log(`   ✅ DONE: ${userData.full_name}`);
    return {
      status: "created",
      ...userData,
      auth_id: authData.user.id,
      workspace_username: workspace?.username,
    };

  } catch (error) {
    console.error(`   ❌ ERROR: ${error.message}`);
    return { status: "failed", ...userData, error: error.message };
  }
}

// ============================================================
// 🎬 MAIN
// ============================================================
async function main() {
  console.log("🚀 SEED USERS — VibesDoc");
  console.log("=============================================\n");
  console.log(`📋 Total user: ${userList.length}\n`);

  const results = { created: [], skipped: [], failed: [] };

  for (const user of userList) {
    const result = await createUser(user);
    if (results[result.status]) {
      results[result.status].push(result);
    } else {
      results.failed.push(result);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("\n\n=============================================");
  console.log("📊 HASIL");
  console.log("=============================================\n");

  console.log(`✅ Created : ${results.created.length}`);
  results.created.forEach((r) => console.log(`   ✅ ${r.full_name} (${r.email}) — ${r.role}`));

  console.log(`\n⏭️  Skipped : ${results.skipped.length}`);
  results.skipped.forEach((r) => console.log(`   ⏭️  ${r.full_name} (${r.email})`));

  console.log(`\n❌ Failed  : ${results.failed.length}`);
  results.failed.forEach((r) => console.log(`   ❌ ${r.full_name} (${r.email}): ${r.error}`));

  console.log("\n\n=============================================");
  console.log("🔑 LOGIN CREDENTIALS");
  console.log("=============================================\n");
  [...results.created, ...results.skipped].forEach((u) => {
    console.log(`👤 ${u.full_name} (${u.role})`);
    console.log(`   Email     : ${u.email}`);
    console.log(`   Password  : ${u.password}`);
    if (u.workspace_username) {
      console.log(`   Workspace : @${u.workspace_username}`);
      console.log(`   Public URL: /@${u.workspace_username}`);
    }
    console.log("");
  });
  console.log("⚠️  Ganti password setelah login pertama!\n");

  console.log("=============================================");
  console.log("🔍 VERIFY DI SUPABASE SQL EDITOR");
  console.log("=============================================\n");
  console.log("Run this to confirm everything is wired up:");
  console.log(`
SELECT
  u.email,
  up.full_name AS profile_name,
  up.role,
  w.username AS workspace_username,
  w.display_name AS workspace_display_name
FROM auth.users u
LEFT JOIN public.user_profiles up ON up.id = u.id
LEFT JOIN public.workspaces w ON w.user_id = u.id
ORDER BY u.created_at;
  `);
}

main()
  .then(() => { console.log("\n✅ Script selesai!"); process.exit(0); })
  .catch((error) => { console.error("\n❌ Script gagal:", error); process.exit(1); });