import React from "react";
import StoragePage from "@/components/ui/storage";
import Layout from "@/components/layouts/baseLayout";

function Storage() {
  return (
    <Layout title="Storage">
      <div className="px-4 py-6 sm:px-6">
        <StoragePage />
      </div>
    </Layout>
  );
}

export default Storage;
