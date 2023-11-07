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
import { useAuth } from "@/pages/contexts/auth";
import { useTheme } from "@/pages/contexts/theme";
import Sidebar from "@/components/ui/sidebar";
import Searchbar from "@/components/ui/searchbar";
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
        <div className="flex flex-wrap justify-evenly px-2 pt-2">
          <Searchbar />
        </div>
        <div className="flex flex-wrap px-2 justify-start">
          <div
            className="w-full max-h-[80vh] overflow-auto"
            style={{
              backgroundColor: theme.primary,
            }}
          >
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
              : [1, 2, 3].map((item, index) => (
                  <ImageGroup
                    data={[]}
                    key={index}
                    loadingState={true}
                    theme={theme}
                  />
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Image;
