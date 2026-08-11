import { ConfigContainer } from "@/features/settings";

interface SettingsPageProps {
  login: () => Promise<void>;
  logout: (uid: string) => Promise<void>;
}

export const SettingsPage = (props: SettingsPageProps) => <ConfigContainer {...props} />;
