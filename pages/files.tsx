import React, { useCallback, useState, useEffect, useMemo } from "react";
import { useTheme } from "../utils/contexts/theme";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { datatype, fileType } from "@/components/types";
import db from "@/firebase/firestore";
import { useAuth } from "../utils/contexts/auth";
import FileFrame from "@/components/frames/files";
import Layout from "@/components/layouts/baseLayout";
import { useSearch, filterGroups } from "@/utils/contexts/search";

function Documents() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [files, setFiles] = useState<fileType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { query: searchQuery } = useSearch();

  const getImageData = useCallback(async (id: string) => {
    const collectionRef = collection(db, `User/${id}/Files`);
    const Ref = query(
      collectionRef,
      orderBy("date", "asc"),
      where("location", "==", "Home")
    );
    const querySnapshot = await getDocs(Ref);

    const data: fileType[] = [];
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
    setFiles(data);
    // console.log(data);
    setLoading(false);
  }, []);
  useEffect(() => {
    if (!user?.uid) return;
    getImageData(user?.uid);
  }, [getImageData, user?.uid]);
  const visible = useMemo(() => filterGroups(searchQuery, files), [searchQuery, files]);

  return (
    <Layout title="Files">
      {visible.length > 0
        ? visible.map((item, index) => (
          <FileFrame
            key={index}
            data={item.data}
            loadingState={loading}
            theme={theme}
            title={item.date}
          />
        ))
        : <FileFrame loadingState={loading} theme={theme} title="Files" />}
    </Layout>
  );
}

export default Documents;
