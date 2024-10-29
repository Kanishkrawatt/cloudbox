import { Context , createContext, useContext, useEffect, useState} from 'react'

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

export const MediaQueryProvider = ({ children }: { children: React.ReactNode }) => {
    const [isMobile, setIsMobile] = useState<boolean>(false)
    const [isTablet, setIsTablet] = useState<boolean>(false)
    const [isDesktop, setIsDesktop] = useState<boolean>(false)

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsMobile(true)
                setIsTablet(false)
                setIsDesktop(false)
            } else if (window.innerWidth < 1024) {
                setIsMobile(false)
                setIsTablet(true)
                setIsDesktop(false)
            } else {
                setIsMobile(false)
                setIsTablet(false)
                setIsDesktop(true)
            }
        }
        window.addEventListener('resize', handleResize)
        handleResize()
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
        <MediaQueryContext.Provider value={{ isMobile, isTablet, isDesktop }}>
            {children}
        </MediaQueryContext.Provider>
    )
}

export default MediaQueryProvider