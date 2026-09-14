import React, { useState, useCallback, useEffect } from "react";
import RecentImages from "@/components/frames/images";
import ImageGroup from "@/components/frames/imageGroup";
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
import Link from "next/link";

function Image() {
  const { theme } = useTheme();
  const [images, setImages] = useState<imageType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // get qyery params

  const router = useRouter();
  const { id } = router.query;

  const getImageData = useCallback(async (id: string) => {
    const data = await fetch(`/api/smartgroup?id=${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
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
    getImageData(id as string);
  }, [getImageData, id]);

  return (
    <Layout title="Smart Groups">
            {images.length > 0
              ? images.map((item, index) => (
                  <ImageGroup
                    key={index}
                    data={item.data}
                    loadingState={loading}
                    theme={theme}
                    id={`${id}`}
                    title={item.date}
                  />
                ))
              : <ImageGroup data={[]} loadingState={loading} theme={theme} />}
    </Layout>
  );
}

export default Image;