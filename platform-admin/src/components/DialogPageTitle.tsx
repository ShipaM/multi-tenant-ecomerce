import type { FC } from "react";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type DialogPageTitleProps = {
  title: string;
  description: string;
  className?: string;
  classNameTitle?: string;
};

/** The heading block of a dialog: looks like PageTitle, but names the dialog for assistive technology. */
export const DialogPageTitle: FC<DialogPageTitleProps> = ({
  title,
  description,
  className,
  classNameTitle,
}) => (
  <div className={cn(className)}>
    <DialogTitle
      className={cn("text-xl leading-normal font-bold", classNameTitle)}
    >
      {title}
    </DialogTitle>
    <DialogDescription className="mt-0.5">{description}</DialogDescription>
  </div>
);
