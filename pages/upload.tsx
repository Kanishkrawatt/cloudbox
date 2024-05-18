/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useCallback } from "react";
import { uploadBytesResumable, getDownloadURL,ref } from "firebase/storage";
import { collection, doc, updateDoc, addDoc,getDoc } from "firebase/firestore";
import { useAuth } from "../utils/contexts/auth";
import { useTheme } from "../utils/contexts/theme";
import storage from "@/firebase/storage";
import db from "@/firebase/firestore";
import { TempFilesData } from "./smartshare";

function UploadFile({
  location,
  files,
  status,
}: {
  location: string;
  files: React.Dispatch<React.SetStateAction<TempFilesData[]>>;
  status: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [filesArray, setFilesArray] = useState<File[]>([]);
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  const Path = (file: File) => (file.type.startsWith("image/") ? "Images" : "Files");

  const uploadFileToFirestore = useCallback(
    async (file: File, downloadURL: string) => {
      try {
        await addDoc(collection(db, `User/${user?.uid}/${Path(file)}`), {
          name: file.name,
          size: file.size,
          location: location,
          type: file.type,
          url: downloadURL,
          date: new Date().toDateString(),
        });
      } catch (error: any) {
        setError(error.message);
      }
    },
    [user?.uid, location]
  );

  const HandleStorage = useCallback(async (size: number) => {
    const userDocRef = doc(db, "User", `${user?.uid}`);
    const data = await getDoc(userDocRef);
    const Storage = data.data()?.Storage;
    await updateDoc(userDocRef, {
      Storage: {
        ...Storage,
        Used: Storage.Used + size / 1024 ** 2,
        Free: Storage.Free - size / 1024 ** 2,
      },
    });
    const userData = JSON.parse(
      (localStorage && localStorage.getItem("User")) ?? "{}"
    );
    localStorage &&
      localStorage.setItem(
        "User",
        JSON.stringify({
          ...userData,
          Storage: {
            ...userData.Storage,
            Used: Storage.Used + size / 1024 ** 2,
            Free: Storage.Free - size / 1024 ** 2,
          },
        })
      );
  }, []);

  const uploadFileToStorage = useCallback(async (file: File) => {
    const storageRef = ref(storage, `${user?.uid}/${Path(file)}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    const blobURL = URL.createObjectURL(file);
    files((prev) => [
      ...prev,
      {
        file: file,
        url: blobURL,
      },
    ]);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        status(Math.round(progress));
      },
      (error) => {
        setError(error.message);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await uploadFileToFirestore(file, downloadURL);
        } catch (error: any) {
          setError(error.message);
        }
      }
    );
  }, [user?.uid, uploadFileToFirestore]);

  useEffect(() => {
    filesArray.forEach(async (file) => {
      await HandleStorage(file.size);
      await uploadFileToStorage(file);
    });
  }, [filesArray]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      const filesArray = Array.from(fileList);
      setFilesArray(filesArray);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full" style={{ color: theme.text }}>
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-[40vh] border-2 border-gray-300 border-dashed rounded-lg cursor-pointer mb-2"
          style={{ backgroundColor: theme.secondary }}
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
            <p className="mb-2 text-sm">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
          </div>
          <input
            id="dropzone-file"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            multiple 
          />
        </label>
      </div>
    </div>
  );
}

export default UploadFile;