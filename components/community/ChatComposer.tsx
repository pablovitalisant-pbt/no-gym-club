'use client';

import { useTranslations } from 'next-intl';
import { MESSAGE_MAX } from '@/lib/community/validate';

interface Props {
  draft: string;
  sendable: boolean;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
}

export default function ChatComposer({ draft, sendable, onChange, onKeyDown, onSend }: Props) {
  const t = useTranslations('community');

  return (
    <div className="space-y-xs">
      <textarea
        rows={2}
        maxLength={MESSAGE_MAX}
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={!sendable}
        placeholder={t('messagePlaceholder')}
        className="w-full bg-surface-900 brutalist-border brutalist-input p-4 text-on-surface disabled:opacity-50"
      />
      <div className="flex items-center justify-between gap-sm">
        <span className="text-on-surface-variant text-label-sm">
          {draft.length >= MESSAGE_MAX - 100 ? `${draft.length}/${MESSAGE_MAX}` : ''}
        </span>
        <button
          type="button"
          onClick={onSend}
          disabled={!sendable || !draft.trim()}
          className="px-6 py-3 min-h-[56px] bg-accent text-surface-900 font-semibold disabled:opacity-50"
        >
          {t('sendButton')}
        </button>
      </div>
    </div>
  );
}
