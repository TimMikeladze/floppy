import * as React from "react"

export function useIsPwa() {
  const [isPwa, setIsPwa] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia("(display-mode: standalone)")
    const onChange = () => {
      setIsPwa(mql.matches)
    }
    mql.addEventListener("change", onChange)
    setIsPwa(mql.matches)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isPwa
}
