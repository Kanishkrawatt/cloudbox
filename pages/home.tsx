import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import RecentImages from "@/components/frames/recentImages";
import RecentFiles from "@/components/frames/recentFiles";
import { datatype } from "@/components/types";
import { useAuth } from "../utils/contexts/auth";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import db from "@/firebase/firestore";
import { useTheme } from "../utils/contexts/theme";
import { useMediaQuery } from "../utils/contexts/mediaQuery";
import { useSearch, filterItems } from "@/utils/contexts/search";
import Layout from "@/components/layouts/baseLayout";
import Icon from "@/components/ui/icons";
import Memories from "@/components/frames/memories";

function Home() {
  const { theme } = useTheme();
  const [data, setData] = useState<datatype[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { isMobile } = useMediaQuery();
  const { query: searchQuery } = useSearch();

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

  const visible = filterItems(searchQuery, data);
  const firstName = user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0];

  return (
    <Layout
      title="Home"
      action={
        <Link href="/uploadFile" className="btn btn-primary hidden h-9 text-[13px] sm:inline-flex">
          <Icon name="upload" size={15} />
          Upload
        </Link>
      }
    >
      <div className="px-4 pb-1 pt-6 sm:px-6">
        <h2 className="text-[1.25rem] font-semibold tracking-tight">
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: theme.muted }}>
          {searchQuery
            ? `Showing matches for “${searchQuery}”`
            : "Your latest uploads and folders."}
        </p>
      </div>

      {!searchQuery && <Memories data={data} theme={theme} />}
      <RecentFiles theme={theme} />
      <RecentImages
        data={visible.slice(0, isMobile ? 6 : 12)}
        loadingState={loading}
        size="medium"
        theme={theme}
          title="Recent images"
        />
    </Layout>
  );
}

export default Home;
