import "@/styles/globals.css";
import type { AppProps } from "next/app";
import AuthProvider from "../utils/contexts/auth";
import ThemeProvider from "../utils/contexts/theme";
import MediaQueryProvider from "../utils/contexts/mediaQuery";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MediaQueryProvider>
          <Component {...pageProps} />
        </MediaQueryProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
export default MyApp;
