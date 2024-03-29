/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
// eslint-disable-next-line @next/next/no-img-element

import React, { useEffect, useState, useLayoutEffect } from "react";
import Styled from "styled-components";
import Link from "next/link";
import { useTheme } from "@/pages/contexts/theme";
import { useMediaQuery } from "@/pages/contexts/mediaQuery";

const Sidebar = () => {
  const { sidebar } = useTheme();
  const [open, setOpen] = useState(true);
  const { isMobile } = useMediaQuery();

  useEffect(() => {
    const sidebar = sessionStorage.getItem("sidebar");
    if (sidebar && !isMobile) {
      const { open } = JSON.parse(sidebar);
      setOpen(open);
    }
    if (isMobile) {
      setOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    sessionStorage.setItem("sidebar", JSON.stringify({ open }));
  }, [open]);

  const Menus = [
    { title: "Home", src: "Chart_fill", link: "/" },
    { title: "Images", src: "Chat", link: "/images" },
    { title: "Files", src: "Folder", link: "/files" },
    { title: "Smart Share", src: "Calendar", gap: true, link: "/smartshare" },
    { title: "Api", src: "Search", link: "/CloudBoxApi" },
    { title: "Storage", src: "Chart", link: "/storage" },
    { title: "Setting", src: "Setting" },
    { title: "Upload", src: "Folder", gap: true, link: "uploadFile" },
  ];

  return (
    <div
      className={` ${open ? "w-72" : "w-20 "} h-screen p-5 pt-8 relative 
      duration-200 transition-all overflow-hidden
      `}
      style={{
        backgroundColor: sidebar.primary,
        color: sidebar.text,
        display: isMobile ? "none" : "block",
      }}
    >
      <div
        className="flex gap-x-4 items-center "
        onClick={() => setOpen(!isMobile && !open)}
      >
        <img
          src="/logo.png"
          className={`cursor-pointer`}
          style={{
            filter: `invert(${sidebar.invertImage ? "1" : "0"})`,
          }}
        />
        <h1
          className={`origin-left font-medium text-xl ${
            open ? "w-52 delay-150" : "w-0"
          } overflow-hidden transition-width`}
        >
          Cloud Box
        </h1>
      </div>
      <ul className="pt-6">
        {Menus.map((Menu, index) => (
          <Link href={Menu?.link ?? ""} key={index}>
            <Li
              color={sidebar.hover}
              className={`flex p-2 cursor-pointer rounded-full
                text-sm items-center gap-x-4 
                ${Menu.gap ? "mt-9" : "mt-2"} ${
                index === 0 && "bg-light-white"
              } `}
            >
              <img
                src={`/${Menu.src}.png`}
                style={{
                  filter: `invert(${sidebar.invertImage ? "1" : "0"})`,
                }}
              />
              <span
                className={`${
                  open ? "w-52 delay-150" : "w-0"
                } overflow-hidden transition-width `}
              >
                {Menu.title}
              </span>
            </Li>
          </Link>
        ))}
      </ul>
    </div>
  );
};

const Li = Styled.li`
    &:hover {
      background-color: ${({ color }: { color?: string }) => color};
    }
  `;

export default Sidebar;
