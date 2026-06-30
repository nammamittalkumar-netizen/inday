import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initialOf } from "@/lib/format";

type Props = {
  name?: string | null;
  image?: string | null;
  className?: string;
  /** Tailwind text-size class for the fallback initial. */
  fallbackClassName?: string;
};

/** Avatar that shows the user's uploaded image, falling back to their initial. */
export function UserAvatar({ name, image, className, fallbackClassName }: Props) {
  return (
    <Avatar className={cn("size-10", className)}>
      {image ? <AvatarImage src={image} alt={name ?? "User"} /> : null}
      <AvatarFallback
        className={cn("bg-primary/10 font-medium text-primary", fallbackClassName)}
      >
        {initialOf(name)}
      </AvatarFallback>
    </Avatar>
  );
}
