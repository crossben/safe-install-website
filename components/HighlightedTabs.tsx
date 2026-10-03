import { highlight } from '@/lib/highlight';
import type { TabItem } from './ui/Tabs';
import { Tabs } from './ui/Tabs';

/**
 * Server component that highlights every panel of every tab during the build
 * and hands the finished HTML to the client `Tabs`.
 */
export async function HighlightedTabs({
  items,
}: {
  items: readonly {
    id: string;
    label: string;
    samples: {
      label: string;
      lang: 'bash' | 'powershell' | 'json' | 'yaml' | 'text';
      code: string;
    }[];
  }[];
}) {
  const highlighted: TabItem[] = await Promise.all(
    items.map(async (item) => ({
      id: item.id,
      label: item.label,
      panels: await Promise.all(
        item.samples.map(async (sample) => ({
          label: sample.label,
          code: sample.code,
          html: await highlight(sample.code, sample.lang),
        })),
      ),
    })),
  );

  return <Tabs items={highlighted} />;
}
