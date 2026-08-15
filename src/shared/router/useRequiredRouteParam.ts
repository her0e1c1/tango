import { useParams } from "react-router-dom";

export const useRequiredRouteParam = (name: string): string => {
  const params = useParams();
  const value = params[name];

  if (value == null) {
    throw new Error(`Missing route parameter: ${name}`);
  }

  return value;
};
