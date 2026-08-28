import { connectToDatabase } from '@/lib/mongodb';
import { Agent } from '@/models/Agent';
import { slugify } from '@/lib/utils';
import {
  requireAdminActor,
  ServiceError,
  type ServiceActor,
} from '@/services/service-auth';
import { logActivity } from '@/services/audit.service';

const PUBLIC_AGENT_FIELDS =
  'name slug title phone email bio avatar specializations languages experienceYears isFeatured';

export interface CreateAgentInput {
  name: string;
  title: string;
  email: string;
  phone: string;
  whatsapp?: string;
  bio: string;
  specializations?: string[];
  languages?: string[];
  experienceYears: number;
  isFeatured?: boolean;
  isActive?: boolean;
}

export type UpdateAgentInput = Partial<CreateAgentInput>;

export async function getFeaturedAgents(
  limit = 4
): Promise<Record<string, unknown>[]> {
  await connectToDatabase();
  const agents = await Agent.find({ isActive: true, isFeatured: true })
    .select(PUBLIC_AGENT_FIELDS)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return agents as Record<string, unknown>[];
}

export async function getAgentBySlug(
  slug: string
): Promise<Record<string, unknown> | null> {
  await connectToDatabase();
  const agent = await Agent.findOne({ slug, isActive: true })
    .select(PUBLIC_AGENT_FIELDS)
    .lean();
  return agent as Record<string, unknown> | null;
}

export async function getAllActiveAgents(): Promise<Record<string, unknown>[]> {
  await connectToDatabase();
  const agents = await Agent.find({ isActive: true })
    .select(PUBLIC_AGENT_FIELDS)
    .sort({ name: 1 })
    .lean();
  return agents as Record<string, unknown>[];
}

export async function createAgent(
  actor: ServiceActor,
  input: CreateAgentInput
): Promise<{ agentId: string; slug: string }> {
  const admin = await requireAdminActor(actor);
  const slug = await generateUniqueAgentSlug(input.name);

  try {
    const agent = await Agent.create({ ...input, slug, isIllustrative: false });
    await logActivity({
      actor: admin,
      action: 'agent.create',
      entityType: 'Agent',
      entityId: agent._id.toString(),
      changes: [{ field: 'slug', to: slug }],
    });
    return { agentId: agent._id.toString(), slug };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      throw new ServiceError('An agent with this email or slug already exists.', 409);
    }
    throw error;
  }
}

export async function updateAgent(
  actor: ServiceActor,
  agentId: string,
  input: UpdateAgentInput
): Promise<{ success: true }> {
  const admin = await requireAdminActor(actor);
  await connectToDatabase();

  const agent = await Agent.findById(agentId);
  if (!agent) throw new ServiceError('Agent not found.', 404);

  const fields = [
    'name',
    'title',
    'email',
    'phone',
    'whatsapp',
    'bio',
    'specializations',
    'languages',
    'experienceYears',
    'isFeatured',
    'isActive',
  ] as const satisfies readonly (keyof UpdateAgentInput)[];
  const changed: string[] = [];

  for (const field of fields) {
    if (input[field] !== undefined) {
      agent.set(field, input[field]);
      changed.push(field);
    }
  }

  await agent.save();
  await logActivity({
    actor: admin,
    action: 'agent.update',
    entityType: 'Agent',
    entityId: agentId,
    changes: changed.map((field) => ({ field })),
  });

  return { success: true };
}

export async function deactivateAgent(
  actor: ServiceActor,
  agentId: string
): Promise<{ success: true }> {
  const admin = await requireAdminActor(actor);
  const agent = await Agent.findByIdAndUpdate(
    agentId,
    { $set: { isActive: false, isFeatured: false } },
    { new: true, runValidators: true }
  );
  if (!agent) throw new ServiceError('Agent not found.', 404);

  await logActivity({
    actor: admin,
    action: 'agent.delete',
    entityType: 'Agent',
    entityId: agentId,
    changes: [
      { field: 'isActive', to: 'false' },
      { field: 'isFeatured', to: 'false' },
    ],
  });
  return { success: true };
}

export async function generateUniqueAgentSlug(name: string): Promise<string> {
  await connectToDatabase();
  const base = slugify(name);
  let slug = base;
  let attempt = 0;
  while (await Agent.exists({ slug })) {
    attempt++;
    slug = `${base}-${attempt}`;
  }
  return slug;
}
