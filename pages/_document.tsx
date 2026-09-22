import { Html, Head, Main, NextScript } from 'next/document'
import Script from 'next/script'
import { themeStylesheet, themeNoFlashScript, DEFAULT_THEME } from '@/utils/contexts/theme'

export default function Document() {
  return (
    <Html lang="en" data-theme={DEFAULT_THEME}>
      <Head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <style dangerouslySetInnerHTML={{ __html: themeStylesheet() }} />
        {/* Applies the stored theme before first paint so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </Head>
      <body>
        <Main />
        <NextScript />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-xxxxxxxxxx"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_measurement_Id}');
        `}
        </Script>
      </body>
    </Html>
  )
}
