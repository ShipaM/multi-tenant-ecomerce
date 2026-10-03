import { cn } from "cn";
import { Loader2Icon } from "lucide-react";

type SpinnerProps = React.ComponentProps<"svg"> & {
  /** Hide the spinner from assistive tech when the surrounding text already says something is loading. */
  decorative?: boolean;
};

function Spinner({ className, decorative = false, ...props }: SpinnerProps) {
  const a11yProps = decorative
    ? { "aria-hidden": true }
    : { role: "status", "aria-label": "Loading" };

  return (
    <Loader2Icon
      data-slot="spinner"
      {...a11yProps}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
