/**
 * Removes Firestore records that point at Firebase Storage.
 *
 * Cloud Storage for Firebase rejects every request on the Spark plan (HTTP 402
 * since Sept 2024), so those rows are dead pointers: the bytes cannot be fetched
 * by anyone. This deletes the metadata and recomputes each user's storage
 * counter from what actually survives.
 *
 * Folders left empty by the purge are removed too, so the sidebar stops showing
 * folders with nothing in them. A folder that still holds a live file is kept.
 *
 * Usage:
 *   node --env-file=.env.local scripts/purge-dead-storage.mjs           # dry run
 *   node --env-file=.env.local scripts/purge-dead-storage.mjs --apply   # delete
 */
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

const APPLY = process.argv.includes("--apply");
const DEAD = "firebasestorage.googleapis.com";

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_api_Key,
  authDomain: process.env.NEXT_PUBLIC_auth_Domain,
  databaseURL: process.env.NEXT_PUBLIC_database_URL,
  projectId: process.env.NEXT_PUBLIC_project_Id,
  appId: process.env.NEXT_PUBLIC_app_Id,
});
const db = getFirestore(app);

/** Every collection of file records belonging to one user. */
const collectionsFor = async (uid) => {
  const paths = [`User/${uid}/Images`, `User/${uid}/Files`];
  const folders = await getDocs(collection(db, `User/${uid}/Folders`));
  for (const folder of folders.docs) {
    paths.push(`User/${uid}/Folders/${folder.id}/Images`);
    paths.push(`User/${uid}/Folders/${folder.id}/Files`);
  }
  const shares = await getDocs(collection(db, `User/${uid}/Smartshare`));
  for (const share of shares.docs) {
    paths.push(`User/${uid}/Smartshare/${share.id}/files`);
  }
  return paths;
};

let totalDeleted = 0;
let totalKept = 0;
const users = await getDocs(collection(db, "User"));

for (const user of users.docs) {
  const uid = user.id;
  const email = user.data().email ?? "(no email)";
  let deleted = 0;
  let keptBytes = 0;
  let kept = 0;

  for (const path of await collectionsFor(uid)) {
    const snap = await getDocs(collection(db, path));
    for (const record of snap.docs) {
      const data = record.data();
      if ((data.url ?? "").includes(DEAD)) {
        if (APPLY) await deleteDoc(doc(db, path, record.id));
        deleted++;
      } else {
        kept++;
        // Smartshare copies do not count against the user's own quota.
        if (!path.includes("/Smartshare/")) keptBytes += data.size ?? 0;
      }
    }
  }

  if (deleted || kept) {
    console.log(
      `${APPLY ? "purged" : "would purge"} ${String(deleted).padStart(3)}  keep ${String(kept).padStart(3)}  ${email}`
    );
  }

  if (APPLY && deleted) {
    const storage = user.data().Storage;
    if (storage) {
      const used = Number((keptBytes / 1024 ** 2).toFixed(4));
      const total = storage.Total ?? 500;
      await updateDoc(doc(db, "User", uid), {
        Storage: { ...storage, Total: total, Used: used, Free: Number((total - used).toFixed(4)) },
      });
    }
  }

  totalDeleted += deleted;
  totalKept += kept;
}

// Second pass: drop folders that have nothing left in them.
let foldersRemoved = 0;
let foldersKept = 0;
for (const user of users.docs) {
  const uid = user.id;
  const folders = await getDocs(collection(db, `User/${uid}/Folders`));
  for (const folder of folders.docs) {
    const images = await getDocs(collection(db, `User/${uid}/Folders/${folder.id}/Images`));
    const files = await getDocs(collection(db, `User/${uid}/Folders/${folder.id}/Files`));
    if (images.size + files.size > 0) {
      foldersKept++;
      continue;
    }
    if (APPLY) await deleteDoc(doc(db, `User/${uid}/Folders`, folder.id));
    foldersRemoved++;
  }
}

console.log(
  `\n${APPLY ? "Deleted" : "Would delete"} ${totalDeleted} dead records and ${foldersRemoved} empty folders; ` +
    `${totalKept} records and ${foldersKept} folders kept.`
);
if (!APPLY) console.log("Dry run only. Re-run with --apply to delete.");
process.exit(0);
