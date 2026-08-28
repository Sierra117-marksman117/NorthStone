import Image from 'next/image';
import Link from 'next/link';
import type { PublicAgentCard } from '@/types/public';

export function AgentCard({ agent }: { agent: PublicAgentCard }) {
  return (
    <article className="agent-card">
      <Link href={'/agents/' + agent.slug} className="agent-card-media">
        {agent.avatar ? (
          <Image
            src={agent.avatar.url}
            alt={agent.avatar.alt}
            fill
            sizes="(max-width: 700px) 100vw, 25vw"
          />
        ) : (
          <span className="media-placeholder">{agent.name.charAt(0)}</span>
        )}
      </Link>
      <p>{agent.title}</p>
      <h3><Link href={'/agents/' + agent.slug}>{agent.name}</Link></h3>
      <span>{agent.specializations.join(' · ')}</span>
    </article>
  );
}
