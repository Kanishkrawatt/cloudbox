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
import { useAuth } from "@/utils/contexts/auth";
import { useTheme } from "@/utils/contexts/theme";
import Layout from "@/components/layouts/baseLayout";
import { datatype, imageType } from "@/components/types";
import { useRouter } from "next/router";

function Image() {
  const { theme } = useTheme();
  const [images, setImages] = useState<imageType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  let g: string | null = null;
  let id: string | null = null;
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    g = url.searchParams.get("g");
    id = url.searchParams.get("id");
  }
  const getImageData = useCallback(async (id: string, g: string) => {
    const data = await fetch(`/api/smartgroup?id=${id}&g=${g}`);
    data.json().then((data) => {
      setImages([
        {
          date: "SmartShare",
          data: data,
        },
      ]);
      setLoading(false);
    });
  }, []);
  useEffect(() => {
    if (!id) return;
    getImageData(id as string, g as string);
  }, [getImageData, id, g]);

  return (
    <Layout title="People">
            {images.length > 0
              ? images.map((item, index) => (
                  <RecentImages
                    key={index}
                    data={item.data}
                    loadingState={loading}
                    theme={theme}
                    title={item.date}
                    size="large" 
                  />
                ))
              : <RecentImages loadingState={loading} theme={theme} title="Photos" />}
    </Layout>
  );
}

export default Image;