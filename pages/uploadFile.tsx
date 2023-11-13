import React, { useEffect, useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import storage from "@/firebase/storage";
import Image from "next/image";
import { useAuth } from "./contexts/auth";
import Upload from "./upload";
import Login from "./login";
import Sidebar from "@/components/ui/sidebar";
import Searchbar from "@/components/ui/searchbar";
import { useTheme } from "./contexts/theme";
import { SmartShareLink, Preview, TempFilesData } from "./smartshare";
export const ImageStatus = ({
  urls,
  status = null,
}: {
  urls: TempFilesData[];
  status?: number | null;
}) => {
  const { theme } = useTheme();
  return (
    <div className="px-[2vw] w-2/5 h-full">
      <h1 className="text-2xl mb-4">Status</h1>
      {urls && urls.length > 0
        ? urls.map((url, k) => (
            <div
              key={k}
              className="flex items-center w-full h-[5vh] border-2 border-gray-300 border-dashed rounded-lg cursor-pointer mb-2 relative"
              style={{
                backgroundColor: theme.secondary,
              }}
            >
              <div className="w-[90%] h-full bg-blue-200">
                <input
                  style={{
                    backgroundColor: theme.secondary,
                    color: theme.text,
                  }}
                  type="text"
                  readOnly={true}
                  value={
                    status === null
                      ? url.file.name.split(".").slice(0, -1).join(".")
                      : status === 0
                      ? `Uploading ...`
                      : status === 100
                      ? url.file.name.split(".").slice(0, -1).join(".")
                      : `${status} %`
                  }
                  className="w-full h-full flex justify-center items-center p-2"
                />
              </div>
              <div
                className="w-[10%] h-full  flex items-center "
                style={{
                  backgroundColor: theme.accent,
                }}
              >
                <button className="w-full h-1/2 p-2 relative">
                  <Image
                    src={"trash.svg"}
                    alt="trash"
                    style={{
                      filter: theme.invertImage ? "invert(1)" : "invert(0)",
                    }}
                    fill
                  />
                </button>
              </div>
            </div>
          ))
        : [1, 2, 3, 4, 5].map((item, k) => {
            return (
              <div
                key={k}
                className="flex items-center w-full h-[5vh] border-2 border-gray-300  border-dashed rounded-lg cursor-pointer mb-2 relative"
              >
                <div className="w-[90%] h-full flex justify-center items-center animate-pulse "></div>
                <div
                  className="w-[10%] h-full  flex items-center "
                  style={{
                    backgroundColor: theme.accent,
                  }}
                >
                  {/* <button className="w-1/2 h-1/2 p-2 relative">
            <Image src={"edit.svg"} alt="download" fill />
          </button> */}
                  <button className="w-full h-1/2 p-2 relative">
                    <Image
                      src={"trash.svg"}
                      alt="trash"
                      fill
                      style={{
                        filter: theme.invertImage ? "invert(1)" : "invert(0)",
                      }}
                    />
                  </button>
                </div>
              </div>
            );
          })}
    </div>
  );
};
export function UploadFile() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [progress, setProgress] = useState<number>(0);
  const [urls, setUrls] = useState<TempFilesData[]>([]);
  const [data, setData] = useState<any>([]);

  if (!user) {
    return <Login />;
  }

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
          color: theme.text,
        }}
      >
        <div className="flex flex-wrap justify-evenly p-2 ">
          <Searchbar />
        </div>
        <div className="flex flex-wrap p-2 justify-start gap-[2rem]">
          <div className="w-full max-h-[55vh] overflow-auto gap-9 flex flex-row">
            <div className="px-[2vw] w-1/2">
              <h1 className="text-2xl mb-4">Upload</h1>
              <div className="flex items-center w-full">
                <Upload location="Home" status={setProgress} files={setUrls} />
              </div>
            </div>
            <ImageStatus urls={urls} status={progress} />
          </div>
          <Preview urls={urls} />
        </div>
      </div>
    </div>
  );
}

export default UploadFile;
