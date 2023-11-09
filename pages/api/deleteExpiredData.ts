// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../firebase/firestore";
import storage from "../../firebase/storage";
import {
  DocumentData,
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";

import { deleteObject, ref } from "firebase/storage";
type Data = {
  name?: string;
  size?: number;
  type?: string;
  url?: string;
  date?: string;
  location?: string;
};
type Error = {
  error: string;
};
type SmartshareDataType = {
  id: string;
  name: string;
  time: number;
  date: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Error | Data[] | DocumentData[]>
) {
  const ref1 = collection(db, "User");
  const getCollectionData = async () => {
    const docSnap = await getDocs(ref1);
    const data = docSnap.docs.map((doc) => doc.data());
    return data;
  };
  async function deleteCollection(collectionPath) {
    const collectionRef = collection(db, collectionPath);
    const querySnapshot = await getDocs(collectionRef);
    querySnapshot.forEach((doc) => {
      deleteDoc(doc.ref);
    });
    // After deleting all the documents, delete the collection itself
    deleteDoc(doc(db, collectionPath));
  }
  getCollectionData().then((data) => {
    data.map((item) => {
      const ref2 = collection(db, `User/${item.uid}/Smartshare`);
      const getSmartShareData = async () => {
        const docSnap = await getDocs(ref2);
        // get document id of each data
        const SmartshareData = docSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        return SmartshareData as SmartshareDataType[];
      };
      getSmartShareData().then((SmartshareData) => {
        SmartshareData.map((item2) => {
          const date = new Date(item2.date);
          const expireTime = item2.time;
          const now = new Date();
          const diff = now.getTime() - date.getTime();
          const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
          if (diffDays > expireTime) {
            
            const ref3 = collection(
              db,
              `User/${item.uid}/Smartshare/${item2.id}/files`
            );
            const getFilesData = async () => {
              const docSnap = await getDocs(ref3);
              const filesData = docSnap.docs.map((doc) => doc.data());
              return filesData;
            };
            getFilesData().then((filesData) => {
              filesData.map((item3) => {
                const url = item3.url;
                const storageRef = ref(storage, url);
                deleteObject(storageRef)
                deleteDoc(doc(db, `User/${item.uid}/Smartshare/${item2.id}`))
                deleteCollection(
                  `User/${item.uid}/Smartshare/${item2.id}/files`
                )
              });
            });
          }
        });
      });
    });
  });
  res.status(200).json({ name: "Working" });
}
