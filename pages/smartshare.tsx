import React, { useEffect, useState, useCallback, useRef } from "react";
import Sidebar from "@/components/ui/sidebar";
import Searchbar from "@/components/ui/searchbar";
import { useTheme } from "./contexts/theme";
import Image from "next/image";
import storage from "@/firebase/storage";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { useAuth } from "./contexts/auth";
import db from "@/firebase/firestore";
import { addDoc, collection, setDoc, doc } from "firebase/firestore";

export interface TempFilesData {
  file: File;
  url: string;
}
function Smartshare() {
  const { theme } = useTheme();
  const [dropDown, setDropDown] = useState<string>("off");
  const [file, setFile] = useState<File | null>(null);
  const [urls, setUrl] = useState<TempFilesData[]>([]);
  const { user } = useAuth();
  const randomId = Math.random().toString(36).substring(7);
  const [smartId, setSmartId] = useState<string>("");
  const [copyState, setCopyState] = React.useState(false);
  const [ModalState, setModalState] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(smartId);
    setCopyState(true);
    setInterval(() => {
      setCopyState(false);
    }, 3000);
  };
  const uploadFileToFirestore = (downloadURL: string, SmartName: string) => {
    try {
      const id = randomId;
      setDoc(doc(db, `User/${user?.uid}/Smartshare/${id}`), {
        name: SmartName,
        time:
          dropDown.split(" ")[1] !== "week"
            ? parseInt(dropDown.split(" ")[0])
            : parseInt(dropDown.split(" ")[0]) * 7,
        date: new Date().toDateString(),
      });
      addDoc(collection(db, `User/${user?.uid}/Smartshare/${randomId}/files`), {
        name: file?.name,
        size: file?.size,
        type: file?.type,
        url: downloadURL,
      });

      // setProgress(0);
      setFile(null);
      setSmartId(
        `https://cloudbox.kanishkrawatt.tech/smartshow?id=${id}-${user?.uid}`
      );
    } catch (error: any) {
      // setError(error.message);
    }
  };
  const uploadFileToStorage = (SmartName: string, name: string, file: File) => {
    const storageRef = ref(
      storage,
      `smartshare/${user?.uid}/${SmartName}/${name}-${new Date()
        .toDateString()
        .split(" ")
        .join("-")}}`
    );
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        // setProgress(Math.round(progress));
      },
      (error) => {
        // setError(error.message);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          uploadFileToFirestore(downloadURL, SmartName);
        } catch (error: any) {
          // setError(error.message);
        }
      }
    );
  };
  const name = useRef<HTMLInputElement>(null);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    if (!name.current?.value) return alert("Please enter a name");
    if (dropDown === "off" || dropDown === "on")
      return alert("Please select a time");
    setModalState(true);
    urls.forEach((url) => {
      uploadFileToStorage(name.current!.value, url.file.name, url.file);
    });
    setUrl([]);
  };

  useEffect(() => {
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    setUrl((prev) => [...prev, { file, url: blobUrl }]);
    return () => URL.revokeObjectURL(blobUrl);
  }, [file]);

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
              <h1 className="text-2xl mb-4">Smart Share</h1>
              <div className="flex items-center w-full">
                <UploadImage setFile={setFile} />
              </div>
              <form onSubmit={submit}>
                <div className="flex">
                  <label
                    htmlFor="search-dropdown"
                    className="mb-2 text-sm font-medium sr-only "
                  ></label>
                  <button
                    className="flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-gray-900 bg-gray-100 border border-gray-300 rounded-l-lg"
                    type="button"
                    onClick={() =>
                      setDropDown(dropDown === "off" ? "on" : "off")
                    }
                  >
                    {dropDown === "on"
                      ? "Time"
                      : dropDown === "off"
                      ? "Time"
                      : dropDown}
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4 ml-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {dropDown === "on" && (
                    <div className="z-10 bg-white divide-y translate-y-[3rem] absolute divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700">
                      <ul
                        className="py-2 text-sm text-gray-700 dark:text-gray-200"
                        aria-labelledby="dropdown-button"
                      >
                        <li
                          onClick={() => {
                            setDropDown("1 day");
                          }}
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          <a>1 days</a>
                        </li>
                        <li
                          onClick={() => {
                            setDropDown("2 day");
                          }}
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          2 days
                        </li>
                        <li
                          onClick={() => {
                            setDropDown("5 day");
                          }}
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          5 days
                        </li>
                        <li
                          onClick={() => {
                            setDropDown("1 week");
                          }}
                          className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          1 week
                        </li>
                      </ul>
                    </div>
                  )}
                  <div className="relative w-full">
                    <input
                      type="search"
                      id="search-dropdown"
                      className="block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-r-lg border-l-gray-100 border-l-2 border border-gray-300 focus:outline-none"
                      placeholder="Title"
                      autoComplete="off"
                      ref={name}
                    />
                    <button
                      type="submit"
                      className="absolute top-1 right-1 p-[1rem] text-sm font-medium text-white bg-gray-50"
                    >
                      <Image src={"enter.svg"} alt="img" fill />
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <ImageStatus urls={urls} />
          </div>
          <Preview urls={urls} />
        </div>
        {ModalState && (
          <div
            className="absolute top-[50%] left-[50%] transform translate-x-[-50%] translate-y-[-50%] h-[30vh] w-[30vw] rounded-xl"
            style={{
              backgroundColor: theme.primary,
              color: theme.text,
              border: `2px solid ${theme.text}`,
            }}
          >
            <div className="flex flex-col h-full gap-4">
              <h1 className="text-2xl mt-5 text-center">SmartLink</h1>
              <div className="flex flex-col w-full justify-between gap-4 px-6">
                <h4 className="text-l text-gray-400">General Access</h4>
                <div className="flex flex-row w-full items-center">
                  <img src="/web.png" alt="logo" className="h-10 w-10" />
                  <div className="flex flex-col m-2 ml-5">
                    <select className="block py-1.5 px-0 w-[60%] text-sm text-gray-300 border-none bg-transparent focus:outline-none">
                      <option
                        value="any"
                        style={{
                          backgroundColor: theme.secondary,
                          color: theme.text,
                        }}
                      >
                        Anyone with the link
                      </option>
                      <option
                        value="any"
                        style={{
                          backgroundColor: theme.secondary,
                          color: theme.text,
                        }}
                      >
                        None
                      </option>
                    </select>
                    <p className="px-1 text-sm">
                      Anyone on the Internet with the link can edit
                    </p>
                  </div>
                  <select className="block px-0 w-20 text-sm border border-gray-500 rounded-md py-3 text-gray-300 bg-transparent focus:outline-none">
                    <option
                      value="any"
                      style={{
                        backgroundColor: theme.secondary,
                        color: theme.text,
                      }}
                    >
                      Editor
                    </option>
                  </select>
                </div>
              </div>
              {smartId ? (
                <div className="flex flex-row w-full items-center justify-between gap-4 p-6">
                  <button
                    className="font-medium rounded-xl text-sm flex flex-row justify-center items-center px-3 py-2 mr-2 mb-2"
                    style={{
                      border: `1px solid ${theme.accent}`,
                      color: theme.text,
                    }}
                    onClick={() => {
                      handleCopy();
                    }}
                  >
                    <img
                      src="/link.svg"
                      alt="copy"
                      className="h-4 w-4 mr-2"
                    />
                    {copyState ? "Copied" : "Copy "}
                  </button>

                  <button
                    className="font-medium rounded-3xl text-sm px-4 py-2 mr-2 mb-2 "
                    style={{
                      backgroundColor: theme.accent,
                      color: theme.secondaryText,
                    }}
                    onClick={() => {
                      setModalState(false);
                    }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex justify-center items-center">
                  <svg
                    aria-hidden="true"
                    className="w-8 h-8 mr-2 text-gray-200 animate-spin  fill-blue-600"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                  <span className="sr-only">Loading...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Smartshare;

export const Preview = ({ urls }: { urls: TempFilesData[] }) => {
  return (
    <div className="px-[2vw] max-w-[80vw] w-full h-[34vh]">
      <h1 className="text-2xl mb-4">Preview</h1>
      <div className="flex h-[30vh] gap-3  overflow-y-hidden overflow-x-auto ">
        {urls && urls.length > 0
          ? urls.map((url, k) => (
              <div
                key={k}
                className="flex flex-col items-center justify-center min-w-[30vw] h-[28vh] border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 mb-2 relative"
              >
                <Image
                  src={url.url}
                  alt="img"
                  fill
                  className="object-contain"
                />
              </div>
            ))
          : [1, 2].map((_, k) => {
              return (
                <div
                  key={k}
                  role="status"
                  className="space-y-8 animate-pulse md:space-y-0 md:space-x-8 md:flex md:items-center"
                >
                  <div className="flex items-center justify-center min-w-[30vw] h-[28vh] bg-gray-300 rounded sm:w-96 dark:bg-gray-400">
                    <svg
                      className="w-12 h-12 text-gray-200"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                      fill="currentColor"
                      viewBox="0 0 640 512"
                    >
                      <path d="M480 80C480 35.82 515.8 0 560 0C604.2 0 640 35.82 640 80C640 124.2 604.2 160 560 160C515.8 160 480 124.2 480 80zM0 456.1C0 445.6 2.964 435.3 8.551 426.4L225.3 81.01C231.9 70.42 243.5 64 256 64C268.5 64 280.1 70.42 286.8 81.01L412.7 281.7L460.9 202.7C464.1 196.1 472.2 192 480 192C487.8 192 495 196.1 499.1 202.7L631.1 419.1C636.9 428.6 640 439.7 640 450.9C640 484.6 612.6 512 578.9 512H55.91C25.03 512 .0006 486.1 .0006 456.1L0 456.1z" />
                    </svg>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
};
export const UploadImage = ({
  setFile,
}: {
  setFile: React.Dispatch<React.SetStateAction<any>>;
}) => {
  const { theme } = useTheme();
  return (
    <label
      htmlFor="dropzone-file"
      className="flex flex-col items-center justify-center w-full h-[40vh] border-2 border-gray-300 border-dashed rounded-lg cursor-pointer mb-2"
      style={{
        backgroundColor: theme.secondary,
      }}
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <svg
          aria-hidden="true"
          className="w-10 h-10 mb-3 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold">Click to upload</span> or drag and
          drop
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          SVG, PNG, JPG or GIF (MAX. 800x400px)
        </p>
      </div>
      <input
        id="dropzone-file"
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files) {
            setFile(e.target.files[0]);
          } else {
            setFile(null);
          }
        }}
      />
    </label>
  );
};

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
