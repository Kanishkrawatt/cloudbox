import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useTheme } from "@/utils/contexts/theme";
import { useMediaQuery } from "@/utils/contexts/mediaQuery";
import { useAuth } from "@/utils/contexts/auth";
import Sidebar from "@/components/ui/sidebar";
import Topbar from "@/components/ui/topbar";
import SelectionBar from "@/components/ui/selectionBar";

/**
 * App shell. Everything inside it requires a session: signed-out visitors are
 * sent to the landing page instead of seeing an empty dashboard.
 */
export default function Layout({
    children,
    title,
    action,
}: {
    children: React.ReactNode;
    title?: string;
    action?: React.ReactNode;
}) {
    const { theme } = useTheme();
    const { isMobile } = useMediaQuery();
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
    }, [loading, user, router]);

    if (loading || !user) {
        return (
            <div
                className="flex h-screen w-full items-center justify-center"
                style={{ backgroundColor: theme.primary, color: theme.muted }}
            >
                <span className="text-[13px]">{loading ? "Loading..." : "Redirecting..."}</span>
            </div>
        );
    }

    return (
        <div
            className="flex h-screen w-full flex-row overflow-hidden"
            style={{ backgroundColor: theme.primary, color: theme.text }}
        >
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
                <Topbar title={title} action={action} />
                <main className={`flex-1 overflow-y-auto ${isMobile ? "pb-24" : "pb-8"}`}>
                    {children}
                </main>
                <SelectionBar />
            </div>
        </div>
    );
}
