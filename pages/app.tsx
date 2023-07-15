import React from "react";
import Image from "next/image";

function App() {
  return (
    <div
      style={{
        height: "300vh",
        width: "100vw",
        display: "flex",
        overflowX: "hidden",
        flexDirection: "column",
      }}
    >
      <section
        className="h-[100vh] w-full"
        id="Hero-section"
        style={{ position: "relative", overflow: "hidden" }}
      >
        <div className="h-full w-full flex flex-col my-[5vh] ">
          <div
            id="top_bar"
            className="h-[15vh] w-full flex flex-row justify-center items-center px-10 z-10"
          >
            <div className="flex flex-row gap-[5vw]">
              <span className="">Home</span>
              <span className="">About</span>
              <span className="">Contact</span>
            </div>
          </div>
          <div id="hero" className="h-[50vh] w-full flex flex-row z-10">
            <div
              className="h-full w-full flex justify-center items-center font-LeagueGothic "
              style={{
                fontSize: "25vw",
                color: "black",
              }}
            >
              CLOUDBOX
            </div>
          </div>
          <div id="sign_up" className="z-10">
            <div className=" h-[15vh] w-full flex items-start justify-center flex-row gap-10 text-[#FFFDD0]">
              <a className="" href="#">
                Pricing
              </a>
              <a className="" href="#">
                Features
              </a>
              <a className="" href="#">
                Api
              </a>
              {/* <a className="">•</a> */}
              <a className="" href="#">
                Docs
              </a>
            </div>
          </div>
          <div id="sign_up" className="z-10">
            <div className=" h-[6vh] w-full flex items-center justify-center ">
              <Image
                src="/icons/scrolldown.png"
                alt="scrolldown"
                style={{
                  filter: "invert(1)",
                }}
                width={40}
                height={40}
              />
            </div>
          </div>
        </div>
        <div
          id="hero_decoration"
          className="absolute h-[120vw] w-[120vw] bg-[#EFFFFD] top-[40vh] left-[50%] translate-x-[-50%] rounded-full"
        ></div>
        <div
          id="hero_decoration"
          className="absolute h-[110vw] w-[110vw] bg-[#B8FFF9] top-[45vh] left-[50%] translate-x-[-50%] rounded-full"
        ></div>
        <div
          id="hero_decoration"
          className="absolute h-[100vw] w-[100vw] bg-[#85F4FF] top-[50vh] left-[50%] translate-x-[-50%] rounded-full"
        ></div>
        <div
          id="hero_decoration"
          className="absolute h-[90vw] w-[90vw] bg-[#42C2FF] top-[55vh] left-[50%] translate-x-[-50%] rounded-full"
        ></div>
      </section>

      <section
        id="about"
        className="h-[100vh] w-full bg-[#B2F9FC] px-[15vw] p-[5vh] flex flex-col gap-[5vh]"
      ></section>
    </div>
  );
}

export default App;
