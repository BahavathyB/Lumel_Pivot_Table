import { useEffect } from "react";

const useDisableScroll = (disable: boolean) => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;

    if (disable) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalOverflow;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [disable]);
};

export default useDisableScroll;
