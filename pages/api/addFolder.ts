import type { NextApiRequest, NextApiResponse } from "next";
import { addDoc, collection, getDocs } from "firebase/firestore";
import db from "../../firebase/firestore";

type FolderDataTypes = {
  name: string;
  date: string;
  size: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { uid, folderName } = req.body;
    const collectionRef = collection(db, `User/${uid}/Folders`);
    await addDoc(collectionRef, {
      name: folderName,
      date: new Date().toLocaleDateString(),
      size: 0,
    });
    res.status(200).json({ status: `${folderName} is Created` });
  } else {
    res.status(200).json({ status: "Not Done" });
  }
}
