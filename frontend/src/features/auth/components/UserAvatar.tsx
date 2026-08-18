import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import type { UserProfile } from "../types"
import { getDisplayName, getInitials } from "../utils"

export interface UserAvatarProps {
  user: Pick<UserProfile, "first_name" | "last_name" | "username"> | null
  className?: string
}

/** Avatar showing the user's initials (or image URL if provided later). */
export function UserAvatar({ user, className }: UserAvatarProps) {
  const name = getDisplayName(user)
  return (
    <Avatar className={className}>
      <AvatarImage src={undefined} alt={name} />
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  )
}
