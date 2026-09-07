import { useEffect } from "react"

export function useUnsavedChanges(isDirty: boolean, message = "Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman ini?") {
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirty) return
      e.preventDefault()
      e.returnValue = message
      return message
    }

    if (isDirty) {
      window.addEventListener("beforeunload", handleBeforeUnload)
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [isDirty, message])
}
