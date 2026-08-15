import type { PropsWithChildren } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

export const RouteParamTestRouter = ({ children, path, route }: PropsWithChildren<{ path: string; route: string }>) => (
  <MemoryRouter initialEntries={[route]}>
    <Routes>
      <Route path={path} element={children} />
    </Routes>
  </MemoryRouter>
);
