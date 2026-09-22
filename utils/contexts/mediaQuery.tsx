import { createContext, useContext, useEffect, useState } from 'react'

type mediaQueryType = {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
}

const MediaQueryContext = createContext<mediaQueryType>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
})

export const useMediaQuery = () => useContext(MediaQueryContext)

const classify = (width: number): mediaQueryType => ({
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
})

export const MediaQueryProvider = ({ children }: { children: React.ReactNode }) => {
    const [value, setValue] = useState<mediaQueryType>({ isMobile: false, isTablet: false, isDesktop: false })

    useEffect(() => {
        // One state object, replaced only when the breakpoint actually changes,
        // so a resize inside the same breakpoint re-renders nothing.
        const handleResize = () => {
            const next = classify(window.innerWidth)
            setValue((prev) =>
                prev.isMobile === next.isMobile && prev.isTablet === next.isTablet && prev.isDesktop === next.isDesktop
                    ? prev
                    : next
            )
        }
        window.addEventListener('resize', handleResize)
        handleResize()
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return <MediaQueryContext.Provider value={value}>{children}</MediaQueryContext.Provider>
}

export default MediaQueryProvider
