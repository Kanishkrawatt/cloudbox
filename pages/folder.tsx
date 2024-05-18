import React, { useState, useCallback, useEffect } from "react";
import RecentImages from "@/components/frames/images";
import { useTheme } from "@/utils/contexts/theme";
import { datatype } from "@/components/types";
import { useRouter } from "next/router";
import Layout from "@/components/layouts/baseLayout";
import { useAuth } from "@/utils/contexts/auth";
import axios from "axios";

function Folder() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const router = useRouter();

    const { name } = router.query;
    const [loading, setLoading] = useState<boolean>(true);
    const [images, setImages] = useState<datatype[]>([]);


    const getData = useCallback(async () => {
        const data = await fetch("/api/getImages", {
            method: "POST",
            body: JSON.stringify({ uid: user?.uid, folderName: name }),
            headers: {
                "Content-Type": "application/json",
            },
        }).then((res) => res.json());
        setImages(data);
        setLoading(false);
    }, [name, user?.uid]);

    useEffect(() => {
        if (!user?.uid) return;
        getData();
    }, [getData, user?.uid]);

    return (
        <Layout>
            <RecentImages
                data={images}
                loadingState={loading}
                size={"large"}
                theme={theme}
                title={name as string}
            />
        </Layout>
    );
}

export default Folder;
