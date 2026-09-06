export const cancelDeckDeletion = ({
  pending,
  setTarget,
}: {
  pending: boolean;
  setTarget: (target: undefined) => void;
}): void => {
  if (!pending) setTarget(undefined);
};
