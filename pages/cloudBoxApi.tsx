import fs from "fs";
import React from "react";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote } from "next-mdx-remote";
import { components } from "@/components/md";
import Layout from "@/components/layouts/baseLayout";
import { useTheme } from "../utils/contexts/theme";

const Api = ({ source }: { source: any }) => {
  const { theme } = useTheme();
  return (
    <Layout title="API">
      <div className="max-w-3xl px-4 py-6 text-[14px] leading-7 sm:px-6">
        <MDXRemote {...source} components={components} />
      </div>
    </Layout>

  );
};

export default Api;

export async function getStaticProps() {
  const source = fs.readFileSync("docs/api.md");
  const mdxSource = await serialize(source);
  return { props: { source: mdxSource }, revalidate: 10 };
}
