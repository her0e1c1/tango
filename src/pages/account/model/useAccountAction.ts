import { useEffect, useState } from "react";

import { dismissToast, showToast, type ToastId } from "@/shared/ui/toast";

interface AccountActionMessages {
  success: string;
  failure: string;
}

type ReportPending = (pending: boolean) => void;

interface FailureToast {
  active: boolean;
  id: ToastId;
}

interface PendingReporter {
  active: boolean;
  report: ReportPending;
}

const createAccountAction = (action: () => Promise<unknown>, messages: AccountActionMessages) => {
  let currentFailure: FailureToast | undefined;
  let mountedReporter: PendingReporter | undefined;

  const reportPending = (reporter: PendingReporter | undefined, pending: boolean) => {
    if (reporter?.active) reporter.report(pending);
  };

  const dismissFailure = (failure: FailureToast): boolean => {
    if (!failure.active) return false;
    failure.active = false;
    if (currentFailure === failure) currentFailure = undefined;
    dismissToast(failure.id);
    return true;
  };

  const dismissCurrentFailure = () => {
    if (currentFailure !== undefined) dismissFailure(currentFailure);
  };

  const execute = async (reporter: PendingReporter | undefined): Promise<void> => {
    reportPending(reporter, true);
    try {
      await action();
      dismissCurrentFailure();
      showToast({ message: messages.success, tone: "success" });
    } catch (error) {
      dismissCurrentFailure();
      let failure!: FailureToast;
      const toastId = showToast({
        message: messages.failure,
        tone: "error",
        action: {
          label: "Retry",
          onClick: () => {
            if (!dismissFailure(failure)) return;
            // Retry must survive route replacement, so it repeats only the application-owned command and notification flow.
            void execute(mountedReporter).catch(() => undefined);
          },
        },
      });
      failure = { active: true, id: toastId };
      currentFailure = failure;
      throw error;
    } finally {
      reportPending(reporter, false);
    }
  };

  return {
    createReporter: (report: ReportPending): PendingReporter => ({ active: false, report }),
    mount: (reporter: PendingReporter) => {
      reporter.active = true;
      mountedReporter = reporter;
      return () => {
        // Route replacement detaches only Page-local pending updates; the failure Toast remains application-owned.
        reporter.active = false;
        if (mountedReporter === reporter) mountedReporter = undefined;
      };
    },
    run: (reporter: PendingReporter) => {
      dismissCurrentFailure();
      return execute(reporter);
    },
  };
};

const accountActions = new WeakMap<() => Promise<unknown>, Map<string, ReturnType<typeof createAccountAction>>>();

const getAccountAction = (action: () => Promise<unknown>, messages: AccountActionMessages) => {
  let actionsByMessage = accountActions.get(action);
  if (actionsByMessage === undefined) {
    actionsByMessage = new Map();
    accountActions.set(action, actionsByMessage);
  }

  const messageKey = `${messages.success}\u0000${messages.failure}`;
  const existing = actionsByMessage.get(messageKey);
  if (existing !== undefined) return existing;

  // Only Toast ownership crosses route mounts; the pending value and every Promise remain local to their Page/command.
  const accountAction = createAccountAction(action, messages);
  actionsByMessage.set(messageKey, accountAction);
  return accountAction;
};

export const useAccountAction = (action: () => Promise<unknown>, messages: AccountActionMessages) => {
  const [pending, setPending] = useState(false);
  const accountAction = getAccountAction(action, messages);
  const [reporter] = useState(() => accountAction.createReporter(setPending));

  useEffect(() => accountAction.mount(reporter), [accountAction, reporter]);

  const run = (): Promise<void> => accountAction.run(reporter);

  return { pending, run };
};
