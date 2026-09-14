// Read-only audit: what is actually in Firestore, and how much of it points at
// the dead Firebase Storage bucket.
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_api_Key,
  authDomain: process.env.NEXT_PUBLIC_auth_Domain,
  databaseURL: process.env.NEXT_PUBLIC_database_URL,
  projectId: process.env.NEXT_PUBLIC_project_Id,
  appId: process.env.NEXT_PUBLIC_app_Id,
});
const db = getFirestore(app);

const classify = (url = "") =>
  url.includes("firebasestorage.googleapis.com")
    ? "firebase"
    : url.includes("res.cloudinary.com")
    ? "cloudinary"
    : "other";

const users = await getDocs(collection(db, "User"));
console.log(`users: ${users.size}\n`);

for (const user of users.docs) {
  const uid = user.id;
  const email = user.data().email ?? "(no email)";
  const rows = [];

  for (const kind of ["Images", "Files"]) {
    const snap = await getDocs(collection(db, `User/${uid}/${kind}`));
    const tally = { firebase: 0, cloudinary: 0, other: 0 };
    snap.forEach((d) => tally[classify(d.data().url)]++);
    if (snap.size) rows.push(`${kind}: ${snap.size} (firebase ${tally.firebase}, cloudinary ${tally.cloudinary}, other ${tally.other})`);
  }

  const folders = await getDocs(collection(db, `User/${uid}/Folders`));
  for (const folder of folders.docs) {
    for (const kind of ["Images", "Files"]) {
      const snap = await getDocs(collection(db, `User/${uid}/Folders/${folder.id}/${kind}`));
      const tally = { firebase: 0, cloudinary: 0, other: 0 };
      snap.forEach((d) => tally[classify(d.data().url)]++);
      if (snap.size) rows.push(`Folders/${folder.data().name ?? folder.id}/${kind}: ${snap.size} (firebase ${tally.firebase}, cloudinary ${tally.cloudinary})`);
    }
  }

  const shares = await getDocs(collection(db, `User/${uid}/Smartshare`));
  let shareFiles = 0, shareFirebase = 0;
  for (const share of shares.docs) {
    const snap = await getDocs(collection(db, `User/${uid}/Smartshare/${share.id}/files`));
    shareFiles += snap.size;
    snap.forEach((d) => { if (classify(d.data().url) === "firebase") shareFirebase++; });
  }
  if (shares.size) rows.push(`Smartshare: ${shares.size} shares, ${shareFiles} files (firebase ${shareFirebase})`);

  console.log(`${email}  [${uid}]`);
  console.log(rows.length ? rows.map((r) => "   " + r).join("\n") : "   (nothing stored)");
  console.log();
}
process.exit(0);
