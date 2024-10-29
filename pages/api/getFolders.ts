import type { NextApiRequest, NextApiResponse } from "next";
import { collection, getDocs } from "firebase/firestore";
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
    const { uid } = req.body;
    const collectionRef = collection(db, `User/${uid}/Folders`);
    const FolderData: FolderDataTypes[] = [];
    await getDocs(collectionRef).then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const { name, date, size } = doc.data();
        FolderData.push({ name, date, size });
      });
      res.status(200).json({ status: "Done", data: FolderData });
    });
  } else {
    res.status(200).json({ status: "Not Done" });
  }
}
