import React, { useState, useCallback, useEffect } from "react";
import RecentImages from "@/components/frames/images";
import db from "@/firebase/firestore";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { useAuth } from "@/pages/contexts/auth";
import { useTheme } from "@/pages/contexts/theme";
import Sidebar from "@/components/ui/sidebar";
import Searchbar from "@/components/ui/searchbar";
import {datatype, imageType } from "@/components/types";

 
function Image() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [images, setImages] = useState<imageType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const getImageData = useCallback(async (id: string) => {
    const collectionRef = collection(db, `User/${id}/Images`);
    const Ref = query(
      collectionRef,
      orderBy("date", "asc"),
      where("location", "==", "Home")
    );
    const querySnapshot = await getDocs(Ref);

    const data: imageType[] = [];
    querySnapshot.forEach((doc) => {
      const docData = doc.data() as datatype;
      const date = docData.date;
      const index = data.findIndex((item) => item.date === date);
      if (index === -1) {
        data.push({
          date: date,
          data: [docData],
        });
      } else {
        data[index].data.push(docData);
      }
    });
    // Sorting the data array
    data.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    setImages(data);
    setLoading(false);
  }, []);
  useEffect(() => {
    if (!user?.uid) return;
    getImageData(user?.uid);
  }, [getImageData, user?.uid]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "row",
      }}
    >
      <Sidebar />
      <div
        className={`w-full max-h-[100vh]`}
        style={{
          backgroundColor: theme.primary,
        }}
      >
        <div className="flex flex-wrap justify-evenly p-2">
          <Searchbar />
        </div>
        <div className="flex flex-wrap p-2 justify-start">
          <div className="w-full max-h-[80vh] overflow-auto" 
            style={{
              backgroundColor: theme.primary,
            }}
          >
            {images.length > 0
              ? images.map((item, index) => (
                  <RecentImages
                    key={index}
                    data={item.data}
                    loadingState={loading}
                    theme={theme}
                    title={item.date}
                  />
                ))
              : [1, 2, 3].map((item, index) => (
                  <RecentImages key={index} loadingState={true} theme={theme} />
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Image;
{
  /* <RecentImages
            data={images}
            loadingState={loading}
            theme={theme}
            title="Recent Images"
          /> */
}
