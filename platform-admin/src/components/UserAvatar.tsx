import type { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type UserAvatarProps = {
  user: User | null;
  className?: string;
};

export const UserAvatar = ({ user, className }: UserAvatarProps) => (
  <Avatar className={className}>
    <AvatarImage src={user?.profileImage} />
    <AvatarFallback className="bg-[#9fe870] font-semibold text-black">
      {user?.avatarName}
    </AvatarFallback>
  </Avatar>
);
