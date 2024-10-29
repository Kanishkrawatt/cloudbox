import React from "react";
import { useTheme } from "@/utils/contexts/theme";
import Sidebar from "@/components/ui/sidebar";
import Searchbar from "@/components/ui/searchbar";

export default function Layout({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();

    return (
        <div
            style={{
                height: "100vh",
                width: "100vw",
                display: "flex",
                flexDirection: "row",
            }}
        >
            <Sidebar />
            <div
                className={`w-full max-h-[100vh]`}
                style={{
                    backgroundColor: theme.primary,
                }}
            >
                <div className="flex flex-wrap justify-evenly px-2 pt-2">
                    <Searchbar />
                </div>
                <div className="flex flex-wrap px-2 justify-start">
                    <div className="w-full max-h-[90vh] overflow-auto"
                        style={{
                            backgroundColor: theme.primary,
                        }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}