import type * as React from "react";
import { useTranslation } from "react-i18next";

import { RouteNotFound } from "@/widgets/route-not-found";

export const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  return <RouteNotFound title={t("notFound.page")} />;
};
