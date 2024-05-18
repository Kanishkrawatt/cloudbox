import React, { useState, useCallback, useEffect } from "react";
import RecentImages from "@/components/frames/images";
import { useTheme } from "@/utils/contexts/theme";
import { imageType } from "@/components/types";
import { useRouter } from "next/router";
import Layout from "@/components/layouts/baseLayout";

function Image() {
  const { theme } = useTheme();
  const [images, setImages] = useState<imageType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // get qyery params

  const router = useRouter();
  const { id } = router.query;
  const getImageData = useCallback(async (id: string) => {
    const data = await fetch(`/api/smartshare/${id}`);
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
    <Layout>
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
    </Layout>
  );
}

export default Image;
