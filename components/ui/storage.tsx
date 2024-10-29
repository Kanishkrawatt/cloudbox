import React from "react";
import { useAuth } from "../../utils/contexts/auth";
import { useTheme } from "../../utils/contexts/theme";
import db from "../../firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie, Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export type ChatType = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
};

function Storage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [Data, setData] = React.useState<ChatType | null>(null);
  const [DisplayData, setDisplayData] = React.useState<{
    free: number;
    used: number;
    total: number;
  } | null>(null);
  React.useEffect(() => {
    if (!user) return;
    const getData = async () => {
      const docRef = doc(db, "User", user?.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setData({
          labels: ["Used", "Free"],
          datasets: [
            {
              label: "Storage (mb)",
              data: [
                docSnap.data()?.Storage?.Used,
                docSnap.data()?.Storage?.Free,
              ],
              backgroundColor: [
                "rgba(75, 192, 192, 0.5)",
                "rgba(153, 102, 255, 0.5)",
              ],
              borderColor: [
                "rgba(75, 192, 192, 0.5)",
                "rgba(153, 102, 255, 0.5)",
              ],
              borderWidth: 1,
            },
          ],
        });
        setDisplayData({
          free: docSnap.data()?.Storage?.Free,
          used: docSnap.data()?.Storage?.Used,
          total: docSnap.data()?.Storage?.Total,
        });
      } else {
        alert("No such document!");
      }
    };
    getData();
  }, [user]);

  return (
    <div className="h-full w-full flex flex-col gap-5">
      <h1
        className="text-2xl"
        style={{
          color: theme.text,
        }}
      >
        Storage
      </h1>
      <div
        className="h-[30vh] w-full flex gap-5 rounded-2xl justify-evenly p-[2rem]"
        style={{
          backgroundColor: theme.secondary,
        }}
      >
        <div className="h-full w-[25%] justify-center items-center flex flex-col gap-10 text-gray-400">
          Storage Used
          {DisplayData && DisplayData?.used > 1080 ? (
            <div
              className="text-2xl font-sans"
              style={{
                color: theme.text,
                fontSize: "6rem",
              }}
            >
              {(DisplayData?.used / 1024).toFixed(2)}
              <span className="text-2xl font-sans"> GB</span>
            </div>
          ) : (
            <div
              className="text-2xl"
              style={{
                color: theme.text,
                fontSize: "6rem",
              }}
            >
              {DisplayData?.used.toFixed(2)}
              <span className="text-2xl font-sans"> MB</span>
            </div>
          )}
        </div>
        <div className="h-full w-[20%] justify-center items-center flex flex-col gap-10 text-gray-400">
          Storage Free
          {DisplayData && DisplayData?.free > 1080 ? (
            <div
              className="text-2xl font-sans"
              style={{
                color: theme.text,
                fontSize: "6rem",
              }}
            >
              {(DisplayData?.free / 1024).toFixed(2)}
              <span className="text-2xl font-sans"> GB</span>
            </div>
          ) : (
            <div
              className="text-2xl"
              style={{
                color: theme.text,
                fontSize: "6rem",
              }}
            >
              {DisplayData?.free.toFixed(2)}
              <span className="text-2xl font-sans">MB</span>
            </div>
          )}
        </div>
        <div className="h-full min-w-[20%] justify-center items-center flex flex-col gap-10 text-gray-400">
          Total Storage
          {DisplayData && DisplayData?.total > 1080 ? (
            <div
              className="text-2xl font-sans"
              style={{
                color: theme.text,
                fontSize: "6rem",
              }}
            >
              {(DisplayData?.total / 1024).toFixed(2)}
              <span className="text-2xl font-sans"> GB</span>
            </div>
          ) : (
            <div
              className="text-2xl"
              style={{
                color: theme.text,
                fontSize: "6rem",
              }}
            >
              {DisplayData?.total.toFixed(2)}
              <span className="text-2xl font-sans"> MB</span>
            </div>
          )}
        </div>
      </div>
      <div className="h-[50vh] w-full flex gap-5">
        <div className="h-full w-[50%] flex  flex-col gap-5">
          <div
            className="flex flex-col gap-2 h-[50vh] w-full justify-center items-center py-5 rounded-2xl"
            style={{
              backgroundColor: theme.secondary,
            }}
          >
            {Data && <Pie data={Data} />}
          </div>
        </div>
        <div className="h-full w-[50%] flex  flex-col gap-5">
          <div
            className="flex flex-col gap-2 h-[50vh] w-full justify-center items-center py-5 rounded-2xl"
            style={{
              backgroundColor: theme.secondary,
            }}
          >
            {Data && <Doughnut data={Data} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Storage;
