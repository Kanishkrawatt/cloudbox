/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
// eslint-disable-next-line @next/next/no-img-element

import React, { useEffect, useState } from "react";
import Styled from "styled-components";
import Home from "./home";
import Login from "./login";
import Sidebar from "@/components/ui/sidebar";
import { useAuth } from "./contexts/auth";
function Index() {
  const { user } = useAuth();

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        overflowX: "hidden",
        flexDirection: "row",
      }}
    >
      <Sidebar />
      <Home />
    </div>
  );
}

export default Index;
