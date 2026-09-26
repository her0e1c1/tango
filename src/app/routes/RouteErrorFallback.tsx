import { useRouteError } from "react-router-dom";
import { AppErrorFallback } from "../error-boundary";

export function RouteErrorFallback() {
  const error = useRouteError();
  return <AppErrorFallback error={error} />;
}
