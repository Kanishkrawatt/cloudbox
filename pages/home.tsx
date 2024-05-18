/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
// eslint-disable-next-line @next/next/no-img-element

import React, { useCallback, useEffect, useState } from "react";
import RecentImages from "@/components/frames/recentImages";
import RecentFiles from "@/components/frames/recentFiles";
import { datatype } from "@/components/types";
import { useAuth } from "../utils/contexts/auth";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import db from "@/firebase/firestore";
import { useTheme } from "../utils/contexts/theme";
import { useMediaQuery } from "../utils/contexts/mediaQuery";
import Layout from "@/components/layouts/baseLayout";

function Home() {
  const { theme,sidebar } = useTheme();
  theme.sidebar = sidebar;
  const [data, setData] = useState<datatype[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { isMobile } = useMediaQuery();
  const getImageData = useCallback(async (id: string) => {
    const collectionRef = collection(db, `User/${id}/Images`);
    const Ref = query(
      collectionRef,
      orderBy("date", "desc"),
      where("location", "==", "Home")
    );
    const querySnapshot = await getDocs(Ref);
    const tempData: datatype[] = [];
    querySnapshot.forEach((doc) => {
      tempData.push(doc.data() as datatype);
    });
    setData(tempData);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    getImageData(user?.uid);
  }, [getImageData, user?.uid]);

  return (
    <Layout>
      <div className="flex flex-wrap justify-evenly p-2">
        <RecentImages
          data={data.slice(0, isMobile ? 2 : 4)}
          loadingState={loading}
          size="large"
          theme={theme}
          title="Recent Images"
        />
        <RecentFiles theme={theme} />
        <RecentImages
          data={data.slice(isMobile ? 2 : 4, isMobile ? 6 : 10)}
          theme={theme}
          size="small"
          loadingState={loading}
          title="Images"
        />
      </div>
    </Layout>

  );
}

export default Home;
