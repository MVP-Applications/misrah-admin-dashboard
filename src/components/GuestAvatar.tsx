import React, { useEffect, useState } from 'react';
import { UserRound } from 'lucide-react';

// Guest/traveler avatar: the real profile image when there is one (an
// http(s) URL that actually loads), otherwise a neutral person icon — never a
// generated placeholder photo. `className` sizes/shapes both variants;
// `fallbackClassName` colours the icon tile.
interface GuestAvatarProps {
  url?: string | null;
  name?: string;
  className?: string;
  fallbackClassName?: string;
  iconSize?: number;
}

export const GuestAvatar = ({
  url,
  name = 'Guest',
  className = 'w-9 h-9 rounded-full',
  fallbackClassName = 'bg-surface border border-border-misrah text-muted-text/60',
  iconSize = 18,
}: GuestAvatarProps) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);

  const hasImage = !!url && /^https?:\/\//.test(url) && !failed;
  if (hasImage) {
    return <img src={url!} alt={name} onError={() => setFailed(true)} className={`${className} object-cover`} />;
  }
  return (
    <div aria-label={name} className={`${className} ${fallbackClassName} flex items-center justify-center shrink-0`}>
      <UserRound size={iconSize} />
    </div>
  );
};
