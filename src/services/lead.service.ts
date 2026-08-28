import { connectToDatabase } from '@/lib/mongodb';
import { Lead } from '@/models/Lead';
import { LEAD_STATUS_TRANSITIONS } from '@/types';
import type { LeadStatus } from '@/types';
import mongoose from 'mongoose';
import { Property } from '@/models/Property';
import { Agent } from '@/models/Agent';
import {
  requireActiveActor,
  requireAdminActor,
  ServiceError,
  type ServiceActor,
  type ServiceRequestContext,
  validateRequestContext,
} from '@/services/service-auth';
import { logActivity } from '@/services/audit.service';
import { checkRateLimit } from '@/lib/rate-limit';

export interface CreateLeadInput {
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  message?: string;
  preferredContactMethod: 'EMAIL' | 'PHONE' | 'WHATSAPP';
  inquiryType: 'BUY' | 'RENT' | 'VALUATION' | 'GENERAL';
  source: 'PROPERTY_PAGE' | 'AGENT_PAGE' | 'CONTACT_PAGE' | 'DIRECT';
  property?: string;
  agent?: string;
  idempotencyKey: string;
}

export async function createLead(
  input: CreateLeadInput,
  requestContext: ServiceActor | ServiceRequestContext
): Promise<{ success: boolean; leadId?: string; duplicate?: boolean }> {
  validateRequestContext(requestContext);
  await connectToDatabase();
  const rateLimit = await checkRateLimit({
    scope: 'lead',
    identifier: requestContext.ipHash ?? input.visitorEmail,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    throw new ServiceError('Too many enquiry submissions. Please try later.', 429);
  }
  const authenticated =
    'userId' in requestContext
      ? await requireActiveActor(requestContext)
      : undefined;

  if (input.property) {
    const exists = await Property.exists({ _id: input.property, isPublished: true });
    if (!exists) throw new ServiceError('Property not found.', 404);
  }
  if (input.agent) {
    const exists = await Agent.exists({ _id: input.agent, isActive: true });
    if (!exists) throw new ServiceError('Agent not found.', 404);
  }

  try {
    const lead = await Lead.create({
      ...input,
      user: authenticated?.userId,
      status: 'NEW',
      assignedTo: undefined,
      internalNotes: [],
      statusHistory: [],
    });
    await logActivity({
      actor:
        authenticated ??
        ({ role: 'SYSTEM', ...requestContext } as const),
      action: 'lead.create',
      entityType: 'Lead',
      entityId: lead._id.toString(),
      changes: [{ field: 'source', to: input.source }],
    });
    return { success: true, leadId: lead._id.toString() };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    ) {
      const existing = await Lead.findOne({
        idempotencyKey: input.idempotencyKey,
        visitorEmail: input.visitorEmail.toLowerCase().trim(),
      })
        .select('_id')
        .lean();
      if (existing) {
        return {
          success: true,
          leadId: existing._id.toString(),
          duplicate: true,
        };
      }
      throw new ServiceError('Submission key has already been used.', 409);
    }
    throw error;
  }
}

export async function transitionLeadStatus(
  leadId: string,
  newStatus: LeadStatus,
  actor: ServiceActor,
  note?: string
): Promise<{ success: boolean; message: string }> {
  const admin = await requireAdminActor(actor);
  await connectToDatabase();

  const lead = await Lead.findById(leadId).select('status');
  if (!lead) return { success: false, message: 'Lead not found.' };

  const allowed = LEAD_STATUS_TRANSITIONS[lead.status];
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      message: `Invalid transition: cannot change status from ${lead.status} to ${newStatus}.`,
    };
  }

  const updated = await Lead.findOneAndUpdate(
    { _id: leadId, status: lead.status },
    {
      $set: { status: newStatus },
      $push: {
        statusHistory: {
          fromStatus: lead.status,
          toStatus: newStatus,
          changedById: new mongoose.Types.ObjectId(admin.userId),
          changedByName: admin.name,
          note,
          changedAt: new Date(),
        },
      },
    },
    { new: true, runValidators: true }
  );
  if (!updated) {
    throw new ServiceError('Lead changed concurrently; reload and try again.', 409);
  }

  await logActivity({
    actor: admin,
    action: 'lead.status_change',
    entityType: 'Lead',
    entityId: leadId,
    changes: [{ field: 'status', from: lead.status, to: newStatus }],
  });

  return { success: true, message: `Status updated to ${newStatus}.` };
}

export async function addLeadInternalNote(
  leadId: string,
  content: string,
  actor: ServiceActor
): Promise<{ success: boolean; message: string }> {
  const admin = await requireAdminActor(actor);
  await connectToDatabase();

  const lead = await Lead.findById(leadId);
  if (!lead) return { success: false, message: 'Lead not found.' };

  lead.internalNotes.push({
    authorId: new mongoose.Types.ObjectId(admin.userId),
    authorName: admin.name,
    content,
    createdAt: new Date(),
  } as unknown as typeof lead.internalNotes[number]);

  await lead.save();
  await logActivity({
    actor: admin,
    action: 'lead.note_add',
    entityType: 'Lead',
    entityId: leadId,
    changes: [{ field: 'internalNotes', to: 'note added' }],
  });
  return { success: true, message: 'Note added.' };
}
