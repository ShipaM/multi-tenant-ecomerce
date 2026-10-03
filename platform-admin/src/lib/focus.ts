/** Ref callback that moves keyboard and screen reader focus to the element when it appears. */
export const focusOnMount = (element: HTMLElement | null): void => {
  element?.focus();
};
