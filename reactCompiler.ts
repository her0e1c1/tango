import babel from "@rolldown/plugin-babel";
import { reactCompilerPreset } from "@vitejs/plugin-react";

export const createReactCompilerPlugin = () =>
  babel({
    presets: [reactCompilerPreset()],
  });
