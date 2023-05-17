import Link from "next/link";
import React from "react";
import { useAuth } from "@/pages/contexts/auth";
import Image from "next/image";

const Searchbar = () => {
  const { user } = useAuth();
  return (
    <div className="w-full h-20 px-5 py-2 flex flex-row">
      <div className="w-1/2 h-full">
        <form className="flex items-center">
          <label htmlFor="simple-search" className="sr-only">
            Search
          </label>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                aria-hidden="true"
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              id="simple-search"
              className="bg-[#f2f2f2] pl-10 py-3  text-gray-900 text-sm rounded-xl block w-full focus:outline-none"
              placeholder="Search"
            />
          </div>
          <button
            type="submit"
            className="p-3 ml-2 text-sm font-medium text-white bg-black rounded-full  hover:bg-slate-500"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="sr-only">Search</span>
          </button>
        </form>
      </div>
      <div className="w-1/2 h-full flex justify-end">
        <div>
          <Link href="/login">
            <button className="p-6 text-sm font-medium relative text-white bg-black rounded-full  hover:bg-slate-500">
              {user?.photoURL ? (
                <Image
                  src={user?.photoURL}
                  alt="user"
                  fill
                  className="object-cover rounded-full"
                />
              ) : (
                <Image
                  src={"/user.svg"}
                  alt="user"
                  fill
                  className="invert object-cover rounded-full"
                />
              )}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Searchbar;
