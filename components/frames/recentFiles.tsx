import Link from "next/link";
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import { themeType } from "@/components/types";
import { useMediaQuery } from "@/utils/contexts/mediaQuery";
import { getStaticProps } from "@/pages/cloudBoxApi";
import axios from "axios";
import { useAuth } from "@/utils/contexts/auth";
import { useTheme } from "@/utils/contexts/theme";

type FolderDataTypes = {
  name: string;
  date: string;
  size: number;
};

const RecentFiles = ({ theme }: { theme: themeType }) => {
  const { isMobile, isTablet } = useMediaQuery();
  const [data, setData] = useState<FolderDataTypes[]>([]);
  const [modal, setModal] = useState<boolean>(false);

  const { user } = useAuth();
  const getFoldersData = useCallback((async () => {
    const data = await axios.post("/api/getFolders", {
      uid: user?.uid
    }).then((res) => { return res.data.data });
    setData(data);
  }), [user?.uid]);

  const handleClick = () => {
    setModal(true);
  }
  const createFolder = useCallback((name: string) => {
    axios.post("/api/addFolder", {
      uid: user?.uid,
      folderName: name
    }).then(() => {
      getFoldersData();
    })
  }, [getFoldersData, user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    getFoldersData();
  }, [getFoldersData, user?.uid]);

  if (isMobile) {
    setData(data.slice(0, 2))
  }
  return (
    <div className="w-full h-full">
      <h1
        className={`font-medium py-5 px-7 `}
        style={{
          color: theme.text,
        }}
      >
        RecentFiles
      </h1>

      <div className="flex flex-wrap px-5 gap-3"
        style={{
          justifyContent: isMobile ? "space-between" : "flex-start",
        }}
      >
        {data.length > 0 ?
          data.map((item, index) => (
            <div key={index} className="h-full"
              style={{
                width: isMobile ? "48%" : isTablet ? "30%" : "auto",
              }}
            >
              <Link href={`/folder?name=${item.name}`}>
                <button
                  type="button"
                  className={`inline-flex border border-transparent 
                  items-center justify-evenly 
                  text-sm font-medium
                  rounded-lg focus:outline-none w-full`}
                  style={{
                    backgroundColor: theme.secondary,
                    color: theme.secondaryText,
                    padding: isMobile ? "4vw 2vw 4vw 0vw" : "1rem 2vw 1rem 1vw",
                  }}
                >
                  <span
                    className={`inline-flex items-center my-2 relative rounded-full`}
                    style={{
                      margin: isMobile ? "0 0.25rem" : "0 0.5rem",
                      height: "2rem",
                      width: "2rem",
                    }}
                  >
                    <Image alt="folder" fill src="/file.svg" />
                  </span>
                  {item?.name}
                </button>
              </Link>
            </div>
          ))
          :
          [1, 2, 3, 4].map((item, index) => (
            <div key={index} className="h-full"
              style={{
                width: isMobile ? "48%" : isTablet ? "30%" : "auto",
              }}
            >
              <button
                type="button"
                className={`inline-flex border border-transparent 
                  items-center justify-evenly 
                  text-sm font-medium
                  rounded-lg focus:outline-none w-full`}
                style={{
                  backgroundColor: theme.secondary,
                  color: theme.secondaryText,
                  padding: isMobile ? "4vw 2vw 4vw 0vw" : "1rem 2vw 1rem 1vw",
                }}
              >
                <span
                  className={`inline-flex items-center my-2 relative rounded-full`}
                  style={{
                    margin: isMobile ? "0 0.25rem" : "0 0.5rem",
                    height: "2rem",
                    width: "2rem",
                  }}
                >
                  <Image alt="folder" fill src="/file.svg" />
                </span>
                Folder {index}
              </button>
            </div>
          ))
        }
        {isMobile && (
          <div className="h-full"
            style={{
              width: isMobile ? "48%" : isTablet ? "30%" : "auto",
            }}
          >
            <Link href={`#`}>
              <button
                type="button"
                className={`inline-flex border border-transparent items-center justify-evenly text-sm font-medium rounded-lg focus:outline-none w-full`}
                style={{
                  backgroundColor: theme.secondary,
                  color: theme.secondaryText,
                  padding: isMobile ? "4vw 2vw 4vw 0vw" : "1rem 2vw 1rem 1vw",
                }}
              >
                <span
                  className={`inline-flex items-center my-2 relative rounded-full`}
                  style={{
                    margin: isMobile ? "0 0.25rem" : "0 0.5rem",
                    height: "2rem",
                    width: "2rem",
                  }}
                >
                  <Image alt="folder" fill src="/file.svg" />
                </span>
                More ...
              </button>
            </Link>
          </div>
        )}
        <div className="h-full"
          style={{
            width: isMobile ? "48%" : isTablet ? "30%" : "auto",
          }}
        >
          <button
            type="button"
            className={`inline-flex border border-transparent 
                  items-center justify-evenly  px-6 
                  text-sm font-medium
                  rounded-lg focus:outline-none w-full`}
            onClick={handleClick}
            style={{
              backgroundColor: theme.secondary,
              color: theme.secondaryText,
              padding: isMobile ? "4vw 2vw 4vw 0vw" : "1rem 2vw 1rem 1vw",
            }}
          >
            <span
              className={`inline-flex items-center my-2 relative rounded-full`}
              style={{
                margin: isMobile ? "0 0.25rem" : "0 0.5rem",
                height: "2rem",
                width: "2rem",
              }}
            >
              <Image alt="folder" fill src="/icons8-plus-30.svg"
                style={{
                  filter: `invert(${theme?.sidebar?.invertImage ? "0" : "1"})`,
                }}
              />
            </span>
            Add New
          </button>
        </div>
      </div>
      {modal &&
        <CreateFolder addFolder={createFolder} setModal={setModal} />
      }
    </div>
  );
};

export default RecentFiles;


export const CreateFolder = ({ addFolder, setModal }: {
  addFolder: (name: string) => void
  setModal: (value: boolean) => void
}) => {
  const { theme } = useTheme();
  const [folderName, setFolderName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const handleCreateFolder = () => {
    if (folderName.length < 3) {
      setError("Folder name must be at least 3 characters");
      return;
    }
    addFolder(folderName);
    setModal(false);
  }
  return (
    <div className="h-[100vh] w-[100vw] flex overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center md:inset-0 max-h-full">
      <div className="relative p-4 w-full max-w-md max-h-full">
        <div className="relative rounded-lg shadow "
          style={{
            backgroundColor: theme.secondary,
            color: theme.secondaryText,
          }}
        >
          <button
            type="button"
            className="absolute top-3 end-2.5  bg-transparent rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
            onClick={() => setModal(false)}
          >
            <svg
              className="w-3 h-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 14 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
              />
            </svg>
            <span className="sr-only">Close modal</span>
          </button>
          <div className="p-4 md:p-5">
            <h3 className="mb-5 text-lg text-center font-normal ">
              Create a new folder
            </h3>
            <input
              type="text"
              placeholder="Folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full p-2 text-center rounded-lg"
              style={{
                backgroundColor: theme.primary,
                color: theme.secondaryText,
              }}
            />
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={handleCreateFolder}
              className="w-full mt-4 text-white bg-blue-600 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
