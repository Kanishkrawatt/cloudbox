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
import { datatype, imageType } from "@/components/types";
import { useRouter } from "next/router";

function Image() {
  const { theme } = useTheme();
  const [images, setImages] = useState<imageType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // get the url of the page
  const url = new URL(window.location.href);
  const g = url.searchParams.get("g");
  const id = url.searchParams.get("id");

  const getImageData = useCallback(async (id: string,g:string) => {
    const data = await fetch(`/api/smartgroup/images?id=${id}&g=${g}`);
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
    getImageData(id as string,g as string);
  }, [getImageData, id,g]);

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
