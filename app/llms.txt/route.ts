import { agentsGuide } from '@/lib/agents';

export const dynamic = 'force-static';

/** /llms.txt: the same instructions `safe-install llm` prints. */
export function GET() {
  return new Response(agentsGuide(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
