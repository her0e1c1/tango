export const get: Select0<ConfigState> = () => (state) => {
  return state.config;
};

export const getByKey =
  <K extends keyof ConfigState>(key: K) =>
  (state: RootState): ConfigState[K] => {
    return state.config[key];
  };
