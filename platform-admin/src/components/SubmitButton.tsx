import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type SubmitButtonProps = ComponentProps<typeof Button> & {
  loading: boolean;
  loadingText: ReactNode;
};

export const SubmitButton = ({
  loading,
  loadingText,
  children,
  className,
  disabled,
  type = "submit",
  ...props
}: SubmitButtonProps) => {
  return (
    <>
      <Button
        type={type}
        className={cn("black h-10", className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Spinner decorative className="size-4" />
            {loadingText}
          </>
        ) : (
          children
        )}
      </Button>
      {/* A disabled button is not announced when its text changes, so progress goes through a live region. */}
      <span role="status" className="sr-only">
        {loading ? "Please wait" : null}
      </span>
    </>
  );
};
