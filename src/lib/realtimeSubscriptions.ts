const subscriptions: Callback[] = [];

export const registerSubscription = (subscription: Callback) => {
  subscriptions.push(subscription);
};

export const stopSubscriptions = () => {
  const errors: unknown[] = [];
  while (subscriptions.length > 0) {
    const subscription = subscriptions.pop();
    try {
      subscription?.();
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length > 0) throw errors[0];
};
