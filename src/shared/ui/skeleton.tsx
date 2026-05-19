import { cn } from "@/shared/lib/utils";

type Props = React.ComponentPropsWithRef<"div">;

function Skeleton({ className, ...props }: Props) {
  return <div className={cn("animate-pulse rounded-md bg-primary/10", className)} {...props} />;
}

export { Skeleton };
