import type { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type UserAvatarProps = {
  user: User | null;
  className?: string;
};

export const UserAvatar = ({ user, className }: UserAvatarProps) => (
  <Avatar className={className}>
    {/* Decorative: the user's name/email is always rendered as visible text nearby, or the trigger already has an aria-label. */}
    <AvatarImage src={user?.profileImage} alt="" />
    <AvatarFallback className="bg-[#9fe870] font-semibold text-black">
      {user?.avatarName}
    </AvatarFallback>
  </Avatar>
);
