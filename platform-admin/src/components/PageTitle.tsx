import type { FC } from "react";
import { cn } from "../lib/utils";

type PageTitleProps = {
  title: string;
  description?: string;
  classNameTitle?: string;
  classNameDescription?: string;
  className?: string;
};
export const PageTitle: FC<PageTitleProps> = ({
  title,
  description,
  classNameTitle,
  classNameDescription,
  className,
}) => {
  return (
    <div className={cn(className)}>
      <h1 className={cn("text-xl font-bold", classNameTitle)}>{title}</h1>
      {description && (
        <p
          className={cn(
            "mt-0.5text-sm text-muted-foreground",
            classNameDescription,
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
};
