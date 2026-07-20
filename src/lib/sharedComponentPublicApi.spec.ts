/**
 * @file Verifies the "component public API" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "exports every component and
 * named prop type from the root barrel".
 */

import { describe, expect, it } from "vitest";
import * as Shared from "@/components";
import type {
  ActionsMenuItem,
  ActionsMenuProps,
  HeaderProps,
  LayoutProps,
  Option,
  RemoteMutationNoticeProps,
  RemoteReadBoundaryProps,
  RouteFeedbackAction,
  RouteFeedbackProps,
} from "@/components";

const components = {
  ActionsMenu: Shared.ActionsMenu,
  Button: Shared.Button,
  Card: Shared.Card,
  Code: Shared.Code,
  Description: Shared.Description,
  Feedback: Shared.Feedback,
  Form: Shared.Form,
  FormItem: Shared.FormItem,
  FullScreen: Shared.FullScreen,
  Header: Shared.Header,
  Input: Shared.Input,
  Layout: Shared.Layout,
  List: Shared.List,
  Logo: Shared.Logo,
  Main: Shared.Main,
  MathContent: Shared.MathContent,
  Outer: Shared.Outer,
  Overlay: Shared.Overlay,
  RemoteMutationNotice: Shared.RemoteMutationNotice,
  RemoteReadBoundary: Shared.RemoteReadBoundary,
  RouteFeedback: Shared.RouteFeedback,
  Score: Shared.Score,
  Section: Shared.Section,
  Select: Shared.Select,
  Slider: Shared.Slider,
  Style: Shared.Style,
  Switch: Shared.Switch,
  Tag: Shared.Tag,
  TagList: Shared.TagList,
  Textarea: Shared.Textarea,
  Title: Shared.Title,
  Upload: Shared.Upload,
};

describe("component public API", () => {
  it("exports every component and named prop type from the root barrel", () => {
    const acceptsTypes = (
      _actionsMenu: ActionsMenuProps,
      _actionsMenuItem: ActionsMenuItem,
      _header: HeaderProps,
      _layout: LayoutProps,
      _option: Option,
      _remoteMutationNotice: RemoteMutationNoticeProps,
      _remoteReadBoundary: RemoteReadBoundaryProps,
      _routeFeedback: RouteFeedbackProps,
      _routeFeedbackAction: RouteFeedbackAction
    ) => {
      void _actionsMenu;
      void _actionsMenuItem;
      void _header;
      void _layout;
      void _option;
      void _remoteMutationNotice;
      void _remoteReadBoundary;
      void _routeFeedback;
      void _routeFeedbackAction;
    };
    acceptsTypes(
      {
        groupLabel: "Actions",
        triggerLabel: "Open actions",
        menuLabel: "Actions menu",
        open: false,
        onToggle: () => {},
        onClose: () => {},
        items: [{ key: "edit", label: "Edit", icon: null }],
      },
      { key: "edit", label: "Edit", icon: null },
      {},
      {},
      { label: "label", value: "value" },
      { pending: false, error: null, onRetry: () => {} },
      { status: "idle", hasData: false, onRetry: () => {}, children: null },
      { title: "Title" },
      { label: "Continue", onClick: () => {} }
    );
    expect(Object.values(components).every((component) => typeof component === "function")).toBe(true);
  });
});
