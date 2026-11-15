import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { AiOutlineEye } from "react-icons/ai";
import { MemoryRouter } from "react-router-dom";
import { studyPreferencesLimits } from "@/entities/preference";
import { SettingsForm } from "@/pages/settings/ui/SettingsForm";
import { SettingsRow, SettingsSection } from "@/pages/settings/ui/SettingsSection";
import { getSettingsFormValues, type SettingsFormValues } from "@/pages/settings/model/queries/getSettingsFormValues";
import { StudyHistoryPeriodPicker } from "@/pages/study-history/ui/StudyHistoryPeriodPicker";
import { RecentStudySessions } from "@/pages/study-history/ui/RecentStudySessions";
import { StudyHistoryTable } from "@/pages/study-history/ui/StudyHistoryTable";
import { StudyHistorySummary } from "@/pages/study-history/ui/StudyHistorySummary";
import { getStudyHistoryChart } from "@/pages/study-history/model/queries/getStudyHistoryChart";
import { AccountView } from "@/pages/account/ui/AccountView";
import { ActionsMenu } from "@/shared/ui/actions-menu/ActionsMenu";
import { RemovableTag } from "@/shared/ui/content/RemovableTag";
import { Style } from "@/shared/ui/content/Style";
import { Slider } from "@/shared/ui/forms/Slider";
import { Switch } from "@/shared/ui/forms/Switch";
import { Layout } from "@/shared/ui/layout";
import { AppLayout } from "@/widgets/app-layout";
import { createPreferences } from "@/test/factories";
import { events, prepareApp, renderFixture } from "../support";

function Menu() {
  const [open, setOpen] = useState(false);
  return (
    <ActionsMenu
      groupLabel="Document actions"
      triggerLabel="Open document actions"
      menuLabel="Document actions"
      open={open}
      onToggle={() => setOpen((value) => !value)}
      onClose={() => setOpen(false)}
      items={[
        { key: "download", label: "Download", icon: null, onSelect: () => events.push({ name: "download", args: [] }) },
        { key: "edit", label: "Edit", icon: null },
        { key: "delete", label: "Delete", icon: null, danger: true },
      ]}
    />
  );
}
function Range() {
  const [value, setValue] = useState("40");
  return (
    <Slider
      aria-label="Interactive slider"
      value={value}
      onChange={(event) => {
        events.push({ name: "slider", args: [event.target.value] });
        setValue(event.target.value);
      }}
    />
  );
}
function SettingsSectionExample() {
  const [checked, setChecked] = useState(true);
  return (
    <SettingsSection title="Appearance" description="Study controls and visual feedback" icon={<AiOutlineEye />}>
      <SettingsRow inputId="show-swipe" label="Show swipe controls" description="Display study swipe action controls">
        <Switch
          id="show-swipe"
          checked={checked}
          aria-describedby="show-swipe-description"
          onChange={(event) => {
            events.push({ name: "swipe", args: [event.target.checked] });
            setChecked(event.target.checked);
          }}
        />
      </SettingsRow>
      <SettingsRow inputId="feedback" label="Show swipe feedback" description="Confirm each study action on screen">
        <Switch id="feedback" checked={false} onChange={() => undefined} />
      </SettingsRow>
    </SettingsSection>
  );
}
function FormExample({ params }: { params?: URLSearchParams } = {}) {
  const preferences = params
    ? createPreferences({
        maxNumberOfCardsToLearn: params.get("boundary") === "maximum" ? 0 : 10,
        cardInterval: 60,
        defaultAutoPlay: params.get("autoplay") === "true",
        showPlaybackControls: params.get("playback") !== "false",
      })
    : createPreferences({ maxNumberOfCardsToLearn: 24, cardInterval: 7, useCardInterval: true });
  const form = useForm<SettingsFormValues>({ defaultValues: getSettingsFormValues(preferences) });
  return (
    <SettingsForm
      form={form}
      studyPreferencesLimits={studyPreferencesLimits}
      version="1.2.3"
      commitHash="0123456789abcdef0123456789abcdef01234567"
    />
  );
}
function PeriodPicker() {
  const form = useForm({ defaultValues: { startDate: "2026-09-01", endDate: "2026-09-22" } });
  return (
    <StudyHistoryPeriodPicker
      preset={30}
      maxDate="2026-09-22"
      startDateInput={form.register("startDate")}
      endDateInput={form.register("endDate")}
      onSelectPeriod={(days) => events.push({ name: "period", args: [days] })}
      onSubmit={(event) => {
        event.preventDefault();
      }}
    />
  );
}
const days = Array.from({ length: 90 }, (_, index) => ({
  date: new Date(2026, 6, index + 1).getTime(),
  started: 1,
  completed: 1,
}));
const sessions = (more: boolean) =>
  Array.from({ length: more ? 10 : 3 }, (_, index) => ({
    sessionId: String(index),
    deckName: more
      ? `Deck ${String(index + 1)}`
      : "A long deck name for studying vocabulary across multiple languages 日本語の単語帳",
    startedAt: new Date(2026, 8, 21, 10).getTime(),
    endedAt: !more && index % 3 === 2 ? null : new Date(2026, 8, 21, 11).getTime(),
    endReason: more ? ("completed" as const) : (["completed", "abandoned", null] as const)[index % 3]!,
    cardCount: more ? 20 : 1234,
  }));
function SummaryExample({ params }: { params: URLSearchParams }) {
  const ninety = params.get("days") === "90";
  const data = ninety
    ? Array.from({ length: 90 }, (_, index) => ({
        date: new Date(2026, 6, index + 1).getTime(),
        started: index % 3,
        completed: index % 2,
      }))
    : Array.from({ length: 30 }, (_, index) => ({
        date: new Date(2026, 8, index + 1).getTime(),
        started: index === 29 ? 2 : 0,
        completed: index === 29 ? 3 : 0,
      }));
  return (
    <StudyHistorySummary chart={getStudyHistoryChart(data)} started={ninety ? 90 : 2} completed={ninety ? 45 : 3} />
  );
}
function AccountExample({ params }: { params: URLSearchParams }) {
  return (
    <AccountView
      isLoggedIn={params.get("linked") === "true"}
      displayName={params.get("linked") === "true" ? "Maya Tanaka" : null}
      uid={params.get("linked") === "true" ? "google-linked-user" : "anonymous-user"}
      signInPending={params.get("pending") === "true"}
      signOutPending={params.get("pending") === "true"}
      onSignIn={() => events.push({ name: "sign-in", args: [] })}
      onSignOut={() => events.push({ name: "sign-out", args: [] })}
    />
  );
}
function contents(params: URLSearchParams): ReactNode {
  prepareApp({ preferences: { language: params.get("locale") === "ja" ? "ja" : "en" } });
  const variant = params.get("variant");
  switch (variant) {
    case "menu":
      return <Menu />;
    case "tag":
      return <RemovableTag label="TypeScript" onRemove={(label) => events.push({ name: "remove", args: [label] })} />;
    case "style":
      return <Style onClick={() => events.push({ name: "click", args: [] })}>Click this styled content</Style>;
    case "slider":
      return <Range />;
    case "switch":
      return <Switch aria-label="Interactive switch" onChange={() => events.push({ name: "switch", args: [] })} />;
    case "settings-section":
      return <SettingsSectionExample />;
    case "settings-form":
      return <FormExample />;
    case "settings-boundaries":
      return <FormExample params={params} />;
    case "multiple-settings":
      return (
        <>
          <section aria-label="First settings">
            <FormExample />
          </section>
          <section aria-label="Second settings">
            <FormExample />
          </section>
        </>
      );
    case "period-picker":
      return <PeriodPicker />;
    case "history-table":
      return <StudyHistoryTable days={days} />;
    case "history-summary":
      return <SummaryExample params={params} />;
    case "recent":
      return <RecentStudySessions sessions={sessions(params.get("more") === "true")} />;
    case "account":
      return <AccountExample params={params} />;
    case "layout":
      return (
        <Layout showHeader fixedHeader>
          {Array.from({ length: 8 }, (_, index) => (
            <section key={index} className="rounded-control bg-surface-muted p-shell-gutter">
              <h2>Section {index + 1}</h2>
              <p>Scroll to observe the elevated header remain fixed above long content.</p>
            </section>
          ))}
        </Layout>
      );
    case "app-layout":
      return (
        <MemoryRouter>
          <AppLayout showHeader fixedHeader={params.get("fixed") !== "false"}>
            {params.get("fixed") === "false" ? (
              <h1>Non-fixed application content</h1>
            ) : (
              Array.from({ length: 8 }, (_, index) => (
                <section key={index} className="rounded-control bg-surface-muted p-shell-gutter">
                  <h2>Application section {index + 1}</h2>
                  <p>Application navigation remains available while this content scrolls.</p>
                </section>
              ))
            )}
          </AppLayout>
        </MemoryRouter>
      );
    default:
      throw new Error(`Unknown shared scenario: ${variant}`);
  }
}

export default function scenario(params: URLSearchParams): ReactNode {
  return renderFixture(contents(params));
}
