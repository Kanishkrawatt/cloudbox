// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../firebase/firestore";
import {
  DocumentData,
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

type Data = {
  name?: string;
  size?: number;
  type?: string;
  url?: string;
  date?: string;
  location?: string;
  group?: string;
};
type Error = {
  error: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Error | Data[] | DocumentData[]>
) {
  const { id } = req.query;
  // id = { ${folderId}-${user?.uid} }
  if (!id) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [folderId, userId] = id?.toString().split("-");
  const ref = collection(db, `User/${userId}/Smartshare/${folderId}/files`);
  const docRef = doc(db, `User/${userId}/Smartshare/${folderId}`);
  const getDocData = async () => {
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    return data;
  };

  const getCollectionData = async () => {
    const docSnap = await getDocs(ref);
    const data = docSnap.docs.map((doc) => doc.data());
    return data;
  };
  getCollectionData()
    .then((data) => {
      getDocData().then((data2) => {
        data.map((item) => {
          item.date = data2?.date || "1";
          item.location = data2?.location || "2";
        });
        const apiData = [
          {
            urls: [
              "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2FTesting%2FIMG_20221027_142317.jpg-Tue-Nov-07-2023%7D?alt=media&token=0384a293-7414-473a-a1dd-e437ede438fe",
              "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2FTesting%2FIMG_20221027_142315.jpg-Tue-Nov-07-2023%7D?alt=media&token=83098d4d-5508-412e-b42b-443c5957ea4e",
              "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2FTesting%2FIMG_20221027_142320.jpg-Tue-Nov-07-2023%7D?alt=media&token=995492ea-5f8d-42fb-9905-22f77609e2dc",
            ],
          },
          {
            urls: [
              "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2FTesting%2FSI_20200424_140500.jpg-Tue-Nov-07-2023%7D?alt=media&token=8b4509ea-44cd-4df9-9135-63a6703af00d",
              "https://firebasestorage.googleapis.com/v0/b/learningfirebase-aa960.appspot.com/o/smartshare%2FD6dUiu8Nr7dWfAcqPI6SywDR4M02%2FTesting%2FIMG_20210105_180851_419.jpg-Tue-Nov-07-2023%7D?alt=media&token=e53b5b8d-062e-4613-b7ef-af3757b1d4e5",
            ],
          },
        ];
        const apiData2: Data[] = [];
        apiData.forEach((item, index) => {
          item.urls.forEach((url) => {
            data.forEach((item2) => {
              if (item2.url === url) {
                apiData2.push({ ...item2, group: `${index}` });
              }
            });
          });
        });
        const groups: string[] = [];
        const apiData3: Data[] = [];
        apiData2.forEach((item) => {
          if (!groups.includes(item.group!)) {
            groups.push(item.group!);
            apiData3.push(item);
          }
        });

        res.status(200).json(apiData3);
      });
    })
    .catch((error) => {
      res.status(404).json({ error: "Not found" });
    });
}
