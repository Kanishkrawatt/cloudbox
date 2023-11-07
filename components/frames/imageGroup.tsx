import { useEffect, useState } from "react";
import { datatype, themeType } from "@/components/types";
import Image from "next/image";
import styled from "styled-components";
import Link from "next/link";

const ImageGroup = ({
  data,
  title,
  theme,
  loadingState,
  id,
}: {
  data: datatype[];
  loadingState: boolean;
  title?: string;
  theme: themeType;
  id?: string;
}) => {
  return (
    <>
      {loadingState || data.length <= 0 ? (
        <div className="w-full h-full">
          <h1
            className={`text-2xl py-5 px-7`}
            style={{
              color: theme.text,
            }}
          >
            Peoples
          </h1>

          <div className="flex flex-wrap px-5 gap-9">
            {[1, 2, 3, 4].map((item, index) => (
              <Div
                key={index}
                className={`rounded-xl focus:ring-4 focus:outline-none w-[75vw] h-[75vw] sm:w-[44vw] sm:h-[44vw] md:h-[22vw] md:w-[22vw]`}
                style={{
                  backgroundColor: theme.secondary,
                  color: theme.secondaryText,
                }}
              >
                <div className="m-[2.5vw] w-[70vw] h-[70vw] sm:m-[2vw] sm:w-[40vw] sm:h-[40vw] md:m-[1vw] md:h-[20vw] md:w-[20vw]">
                  <div
                    role="status"
                    className=" h-full w-full relative rounded-xl z-10"
                  >
                    <div className="h-full relative  w-full flex items-center justify-center z-10 bg-gray-300 rounded-xl dark:bg-gray-500 ">
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
                </div>
              </Div>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full h-full">
          <h1
            className={`text-2xl py-5 px-7`}
            style={{
              color: theme.text,
            }}
          >
            Peoples
          </h1>

          <div className="flex flex-wrap px-5 gap-9 justify-center items-center sm:justify-start sm:items-start">
            {data.map((item, index) => (
              <Div
                key={index}
                className={`rounded-xl focus:ring-4 focus:outline-none w-[75vw] h-[75vw] sm:w-[44vw] sm:h-[44vw] md:h-[22vw] md:w-[22vw]`}
                style={{
                  backgroundColor: theme.secondary,
                  color: theme.secondaryText,
                }}
              >
                <Link href={`/smartgroup/images?id=${id}&g=${item.group}`}>
                  <div className="m-[2.5vw] w-[70vw] h-[70vw] sm:m-[2vw] sm:w-[40vw] sm:h-[40vw] md:m-[1vw] md:h-[20vw] md:w-[20vw]">
                    <div className="h-full w-full relative rounded-xl z-10 justify-center items-center flex">
                      <Image
                        src={item.url}
                        fill
                        placeholder="blur"
                        blurDataURL="/image.png"
                        className="object-cover rounded-xl blur-[1px] "
                        alt="test"
                      />
                      <Image
                        src="/icons/add_2.png"
                        width={50}
                        height={50}
                        className="z-10"
                        alt="more"
                      />
                    </div>
                  </div>
                </Link>
              </Div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGroup;

export const Div = styled.div`
  background-color: ${({ color }: { color?: string }) => color};
`;
