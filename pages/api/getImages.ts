import type { NextApiRequest, NextApiResponse } from "next";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import db from "../../firebase/firestore";

const getData = async (path: string) => {
  const collectionRef = collection(db, path);
  const snapshot = await getDocs(collectionRef);
  const data = snapshot.docs.map((doc) => doc.data());
  return data;
};

async function getImageData(folderName: string, userId: string) {
  const collectionRef = collection(db, `User/${userId}/Folders`);
  const imageRef = query(collectionRef, where("name", "==", folderName));
  let ref = "";
  await getDocs(imageRef).then((querySnapshot) => {
    querySnapshot.forEach((docs) => {
      ref = `User/${userId}/Folders/${docs.id}/Images`;
    });
  });
  return getData(ref);
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { uid, folderName } = req.body;
    if (!uid) {
      res.status(400).json({ status: "uid is required" });
      return;
    }
    if (!folderName) {
      const path = `User/${uid}/Images`;
      const data = await getData(path);
      res.status(200).json(data);
    }

    const data = await getImageData(folderName, uid);

    res.status(200).json(data);
  } else {
    res.status(405).json({ status: "Method Not Allowed" });
  }
}
