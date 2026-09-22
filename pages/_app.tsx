import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import AuthProvider from "../utils/contexts/auth";
import ThemeProvider from "../utils/contexts/theme";
import MediaQueryProvider from "../utils/contexts/mediaQuery";
import SearchProvider from "../utils/contexts/search";
import FaceProfileProvider from "../utils/contexts/faceProfile";
import SelectionProvider from "../utils/contexts/selection";
import UploadProvider from "../utils/contexts/upload";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MediaQueryProvider>
          <SearchProvider>
            <FaceProfileProvider>
              <SelectionProvider>
              <UploadProvider>
              <Head>
                <title>Cloud Box</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
              </Head>
              <Component {...pageProps} />
              </UploadProvider>
              </SelectionProvider>
            </FaceProfileProvider>
          </SearchProvider>
        </MediaQueryProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
export default MyApp;
