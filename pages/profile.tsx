import React from "react";
import Sidebar from "@/components/ui/sidebar";
import Image from "next/image";
import { useAuth } from "../utils/contexts/auth";
import { useTheme, sidebar1, sidebar2, theme1, theme2 } from "../utils/contexts/theme";

function Profile() {
  const { user, UpdateUserDetails, signOut } = useAuth();
  const { theme, setTheme, setSidebar } = useTheme();
  const logout = () => {
    signOut();
    window.location.href = "/";
  };

  const [ModalState, setModalState] = React.useState(true);
  const [copyState, setCopyState] = React.useState(false);
  const [userDetails, setUserDetails] = React.useState({
    name: "",
    email: "",
    photoUrl: "",
  });
  React.useEffect(() => {
    setUserDetails({
      name: user?.displayName ?? "",
      email: user?.email ?? "",
      photoUrl: user?.photoURL ?? "",
    });
  }, [user]);

  const changeTheme = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const theme = e.target.value;
    if (theme === "light") {
      setTheme(theme1);
      setSidebar(sidebar1);

    } else if (theme === "dark") {
      setTheme(theme2);
      setSidebar(sidebar2);
    } else {
      setTheme(theme1);
      setSidebar(sidebar1);
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (userDetails.name === "" || userDetails.email === "") {
      alert("Please fill all the fields");
      return;
    }
    UpdateUserDetails(userDetails.name, userDetails.photoUrl);

    setUserDetails({
      name: user?.displayName ?? "",
      email: user?.email ?? "",
      photoUrl: user?.photoURL ?? "",
    });
  };
  const handleCopy = () => {
    navigator.clipboard.writeText(user!.uid);
    setCopyState(true);
    setInterval(() => {
      setCopyState(false);
    }
      , 3000);
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "row",
        backgroundColor: theme.primary,
      }}
    >
      <Sidebar />
      <div className="flex flex-col w-full">
        <div className="flex flex-col items-center justify-center w-full h-[30vh] bg-orange-300">
          <div
            id="imageHolder"
            className="w-32 h-32 rounded-full  relative"
            
            onClick={() => setModalState(true)}
          >
            <input
              type="file"
              className="absolute z-20 h-full w-full opacity-0"
            />
            <Image
              src="/activeUser.svg"
              fill
              alt="profile"
              className="rounded-full"
            />
          </div>
        </div>
        <form className="px-[5vw] pt-[5vh]" onSubmit={handleSubmit} style={{
          color: theme.text,
        }}>
          <div className="relative z-0 w-full mb-6 group">
            <input
              type="text"
              name="floating_name"
              id="floating_name"
              className="block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none"
              style={{
                borderColor: theme.secondary,
              }}
              placeholder=" "
              value={userDetails.name}
              disabled={user?.displayName ? true : false}
              onChange={(e) =>
                setUserDetails({ ...userDetails, name: e.target.value })
              }
            />
            {userDetails.name.length <= 0 && (
              <label
                htmlFor="floating_name"
                className="peer-focus:font-medium absolute text-sm"
                style={{
                  color: theme.secondaryText,
                }}
              >
                Name
              </label>
            )}
          </div>
          <div className="relative z-0 w-full mb-6 group">
            <input
              type="email"
              name="floating_company"
              id="floating_company"
              className="block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none"
              placeholder=" "
              style={{
                borderColor: theme.secondary,
              }}
              value={userDetails.email}
              disabled={user?.email ? true : false}
              onChange={(e) =>
                setUserDetails({ ...userDetails, email: e.target.value })
              }
            />
            {userDetails.email.length <= 0 && (
              <label
                htmlFor="floating_company"
                className="peer-focus:font-medium absolute text-sm"
                style={{
                  color: theme.secondaryText,
                }}
              >
                Email
              </label>
            )}
          </div>
          <div className="relative z-0 w-full mb-6 group ">
            <label className="text-sm text-gray-500mr-4">
              Secret Token :
            </label>
            <input
              type="text"
              value={user?.uid}
              className="text-sm w-[16rem] p-2 mx-2  appearance-none rounded-md"
              style={{ backgroundColor: theme.secondary }}
            />
            {/* copy button */}
            <button
              className=" border focus:outline-none  font-medium rounded-lg text-sm px-3 py-1.5 mr-2 mb-2"
              style={{
                borderColor: theme.secondary,
              }}
              onClick={() => {
                handleCopy()
              }}
            >
              {
                copyState ? "Copied" : "Copy"
              }
            </button>
          </div>
          <div className="max-w-sm mb-6">
            <label
              htmlFor="countries"
              className="block mb-2 text-sm font-medium "
            >
              Select Theme
            </label>
            <select
              id="countries"
              className="border  text-sm rounded-lg block w-full p-2.5 focus:outline-none focus:ring-4 focus:ring-blue-300"
              onChange={changeTheme}
              style={{
                backgroundColor: theme.secondary,
                borderColor: theme.secondary,
              }}
            >
              <option selected>default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <button
            type="submit"
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center "
          >
            Submit
          </button>
          <button
            type="button"
            onClick={logout}
            className="text-white ml-2 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center -700"
          >
            Logout
          </button>

        </form>
      </div>
    </div>
  );
}

export default Profile;
