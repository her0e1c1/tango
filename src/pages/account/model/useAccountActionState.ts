import { useRef, useState } from "react";

import { useMountedGuard } from "@/shared/lib/useMountedGuard";

export const useAccountActionState = () => {
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const isMounted = useMountedGuard();
  return { pending, setPending, pendingRef, isMounted };
};
