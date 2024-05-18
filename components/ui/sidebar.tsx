/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
// eslint-disable-next-line @next/next/no-img-element

import React, { useEffect, useState } from "react";
import Styled from "styled-components";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "@/utils/contexts/theme";
import { useMediaQuery } from "@/utils/contexts/mediaQuery";

const Sidebar = () => {
  const { sidebar } = useTheme();
  const router = useRouter()
  const [open, setOpen] = useState(false);
  const { isMobile } = useMediaQuery();

  useEffect(() => {
    const sidebar = sessionStorage.getItem("sidebar");
    if (sidebar && !isMobile) {
      const { open } = JSON.parse(sidebar);
      setOpen(open);
    }
  }, [isMobile]);

  useEffect(() => {
    sessionStorage.setItem("sidebar", JSON.stringify({ open }));
  }, [open]);

  const Menus = [
    { title: "Home", src: "home", link: "/" },
    { title: "Images", src: "images", link: "/images" },
    { title: "Files", src: "files", link: "/files" },
    { title: "Api", gap: true, src: "api", link: "/cloudBoxApi" },
    { title: "Storage", src: "storage", link: "/storage" },
    { title: "Upload", src: "upload", gap: true, link: "uploadFile" },
    { title: "Smart Share", src: "smartshare", link: "/smartshare" },
    { title: "Setting", src: "settings", position: "bottom", revert: true },
  ];

  return (
    <div
      className={`${open ? "w-72" : "w-20"} h-screen p-5 pt-8 relative duration-200 transition-all overflow-hidden hidden`}
      style={{
        backgroundColor: sidebar.primary,
        color: sidebar.text,
        display: !isMobile ? "block" : "none",
      }}
    >
      <div
        className="flex gap-x-4 items-center relative"
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
          className={`origin-left font-medium text-xl ${open ? "w-52 delay-150" : "w-0"
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
              className={`flex p-2 cursor-pointer rounded-full text-sm items-center 
                ${Menu.position === "bottom" && "absolute bottom-6"}
                ${Menu.gap ? "mt-9" : "mt-2"} 
                ${index === 0 && "bg-light-white"} 
                ${open ? "gap-x-4" : "gap-x-0"}`}
              style={{
                backgroundColor: router.pathname === Menu.link ? sidebar.hover : ""
              }}>
              <img
                src={`/${Menu.src}.png`}
                style={{
                  filter: `invert(${sidebar.invertImage ? "0" : "1"})`,
                }}
              />
              <span
                className={`overflow-hidden transition-width ${open ? "w-40 delay-150" : "w-0"}`}
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
