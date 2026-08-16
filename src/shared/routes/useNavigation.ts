import type { NavigateOptions, To } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export const useNavigation = () => {
  const navigate = useNavigate();

  return {
    back: () => navigate(-1),
    to: (destination: To, options?: NavigateOptions) =>
      options === undefined ? navigate(destination) : navigate(destination, options),
  };
};
