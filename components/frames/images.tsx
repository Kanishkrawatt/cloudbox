import { useEffect, useState } from "react";
import { datatype, themeType } from "@/components/types";
import Image from "next/image";
import styled from "styled-components";

const RecentImages = ({
  data,
  title,
  theme,
  loadingState,
}: {
  data?: datatype[];
  loadingState: boolean;
  title?: string;
  theme?: themeType;
}) => {
  const [menu, setMenu] = useState<number>(-1);
  const handleClick = (index: number) => {
    if (index !== menu) setMenu(index);
    else setMenu(-1);
  };
  const options = [
    {
      name: "Open",
      onClick: (item:datatype) => {
        window.open(item.url);
      },
    },
    {
      name: "Delete",
      onClick: () => {
        alert("Deleting ");
      },
    },
    {
      name: "share",
      onClick: () => {
        alert("sharing ");
      },
    },
  ];
  return (
    <>
      {loadingState ? (
        <div>
          <h1
            className={`font-medium py-5 px-7`}
            style={{
              color: theme?.text,
            }}
          >
            Date
          </h1>
          <div className="flex flex-wrap px-5 gap-9">
            {[1, 2, 3].map((item) => (
              <Div
                className={`rounded-lg focus:ring-4 focus:outline-none sm:w-[23%] md:w-[23%] lg:w-[23%] w-full`}
                style={{
                  backgroundColor: theme?.secondary,
                  color: theme?.secondaryText,
                }}
                key={item}
              >
                <div className="w-full h-[30vh] p-2">
                  <div className="h-1/6 animate-pulse w-full  z-10 flex justify-between capitalize items-center">
                    <div className="bg-gray-300 h-5 w-1/2 rounded-lg dark:bg-gray-500"></div>
                    <div style={{
                          filter: theme?.invertImage ? "invert(1)" : "invert(0)",
                        }}>
                      <Image
                        src="/threeDotsVertical.svg"
                        width={20}
                        height={20}
                        alt=":"
                      />
                    </div>
                  </div>
                  <div
                    role="status"
                    className=" h-5/6 space-y-8 animate-pulse md:space-y-0 md:space-x-8 md:flex md:items-center"
                  >
                    <div className="h-full relative  w-full flex items-center justify-center z-10 bg-gray-300 rounded dark:bg-gray-500 ">
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
        <div>
          <h1
            className={`font-medium py-5 px-7`}
            style={{
              color: theme?.text,
            }}
          >
            {title}
          </h1>

          <div className="flex flex-wrap px-5 gap-9">
            {data?.map((item, index) => (
              <Div
                key={index}
                className={`rounded-lg focus:ring-4 focus:outline-none sm:w-[23%] md:w-[23%] lg:w-[23%] w-full`}
                style={{
                  backgroundColor: theme?.secondary,
                  color: theme?.secondaryText,
                }}
              >
                {/* <Link href={`/image/${item.id}`}> */}
                <div className="w-full h-[30vh] p-2">
                  <div className="h-1/6  w-full relative  z-10 flex justify-between pl-2 capitalize items-center">
                    {item.date}
                    {index !== -1 && menu === index ? (
                      <div
                        className="hover:bg-gray-200 rounded-full hover:border-gray-200 h-7 w-7 flex justify-center items-center"
                        style={{
                          filter: theme?.invertImage ? "invert(1)" : "invert(0)",
                        }}
                        onClick={() => {
                          handleClick(index);
                        }}
                      >
                        <Image
                          src="/cross.svg"
                          width={10}
                          height={10}
                          alt=":"
                        />
                      </div>
                    ) : (
                      <div
                        className="hover:bg-gray-200 rounded-full hover:border-gray-200 h-7 w-7 flex justify-center items-center"
                        style={{
                          filter: theme?.invertImage ? "invert(1)" : "invert(0)",
                        }}
                        onClick={() => {
                          handleClick(index);
                        }}
                      >
                        <Image
                          src="/threeDotsVertical.svg"
                          width={20}
                          height={20}
                          alt=":"
                        />
                      </div>
                    )}
                    {index !== -1 && menu === index && (
                      <div
                        className="absolute top-[2.5rem] right-1 z-50 rounded-md w-[6rem] h-[6rem]"
                        style={{
                          backgroundColor: theme?.secondary,
                          color: theme?.secondaryText,
                        }}
                      >
                        {options.map((Optionitem, key) => (
                          <div
                            key={key}
                            className="w-full h-1/3 flex justify-center items-center rounded-md"
                          >
                            <div
                              className="w-full h-8 flex justify-center items-center hover:bg-gray-200 hover:text-gray-700"
                              onClick={() => {
                                Optionitem.onClick?.call(null,item);
                              }}
                              style={{
                                borderTop:
                                  key === options.length - 1
                                    ? "1px solid lightgray"
                                    : key === 0
                                    ? "none"
                                    : "1px solid lightgray",
                                borderBottom:
                                  key === 0
                                    ? "1px solid lightgray"
                                    : key === options.length - 1
                                    ? "none"
                                    : "1px solid lightgray",
                                borderRadius:
                                  key === 0
                                    ? "6px 6px 0 0"
                                    : key === options.length - 1
                                    ? "0 0 6px 6px"
                                    : "none",
                              }}
                            >
                              {Optionitem.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="h-5/6 relative  w-full  ">
                    <Image
                      src={item.url}
                      fill
                      placeholder="blur"
                      blurDataURL="/image.png"
                      className="object-cover rounded-lg "
                      alt="test"
                    />
                  </div>
                </div>
                {/* </Link> */}
              </Div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default RecentImages;

export const Div = styled.div`
  background-color: ${({ color }: { color?: string }) => color};
`;
