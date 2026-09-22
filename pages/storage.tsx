import React from "react";
import StoragePage from "@/components/ui/storage";
import Layout from "@/components/layouts/baseLayout";
import Duplicates from "@/components/ui/duplicates";

function Storage() {
  return (
    <Layout title="Storage">
      <div className="flex flex-col gap-8 px-4 py-6 sm:px-6">
        <StoragePage />
        <div className="w-full max-w-3xl">
          <Duplicates />
        </div>
      </div>
    </Layout>
  );
}

export default Storage;
