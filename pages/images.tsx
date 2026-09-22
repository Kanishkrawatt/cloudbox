import React, { useState, useCallback, useEffect, useMemo } from "react";
import RecentImages from "@/components/frames/images";
import Layout from "@/components/layouts/baseLayout";
import db from "@/firebase/firestore";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { useAuth } from "@/utils/contexts/auth";
import { useTheme } from "@/utils/contexts/theme";
import { datatype, imageType } from "@/components/types";
import { useSearch, filterGroups } from "@/utils/contexts/search";
import OnlyMeButton, { useOnlyMe } from "@/components/ui/onlyMeFilter";
import SuggestedAlbums from "@/components/frames/suggestedAlbums";


function Image() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [images, setImages] = useState<imageType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { query: searchQuery } = useSearch();
  const onlyMe = useOnlyMe();

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
  const { filter: onlyMeFilter } = onlyMe;
  const visible = useMemo(
    () =>
      filterGroups(searchQuery, images)
        .map((group) => ({ ...group, data: onlyMeFilter(group.data) }))
        .filter((group) => group.data.length > 0),
    [searchQuery, images, onlyMeFilter]
  );
  const flat = useMemo(() => images.flatMap((g) => g.data), [images]);

  return (
    <Layout
      title="Images"
      action={
        <OnlyMeButton active={onlyMe.active} onToggle={onlyMe.toggle} state={onlyMe.state} />
      }
    >
      {!searchQuery && !loading && user?.uid && (
        <SuggestedAlbums
          data={flat}
          theme={theme}
          onCreated={() => getImageData(user.uid)}
        />
      )}
      {visible.length > 0
        ? visible.map((item, index) => (
          <RecentImages
            key={index}
            data={item.data}
            loadingState={loading}
            theme={theme}
            title={item.date}
          />
        ))
        : <RecentImages loadingState={loading} theme={theme} title="Images" />}
    </Layout>

  );
}

export default Image;
