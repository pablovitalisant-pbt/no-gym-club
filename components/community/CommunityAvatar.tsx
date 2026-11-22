interface Props {
  url: string | null;
  name: string;
  size?: 'sm' | 'md';
}

export default function CommunityAvatar({ url, name, size = 'sm' }: Props) {
  const cls = size === 'md' ? 'w-20 h-20' : 'w-14 h-14';
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className={`${cls} rounded-full object-cover border-2 border-outline shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${cls} rounded-full bg-surface-900 border-2 border-outline flex items-center justify-center font-headline-md text-headline-md text-primary uppercase shrink-0`}
    >
      {name.charAt(0)}
    </div>
  );
}
