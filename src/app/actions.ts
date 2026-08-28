'use server';

import crypto from 'crypto';
import { headers } from 'next/headers';
import { z } from 'zod';
import { hashIp } from '@/lib/utils';
import { createLead } from '@/services/lead.service';
import { ServiceError } from '@/services/service-auth';
import { createVisit } from '@/services/visit.service';

export interface PublicFormState {
  status: 'idle' | 'success' | 'error';
  message: string;
}

export const initialPublicFormState: PublicFormState = {
  status: 'idle',
  message: '',
};

const optionalString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined),
  z.string().optional()
);

const leadSchema = z.object({
  visitorName: z.string().trim().min(2).max(100),
  visitorEmail: z.string().trim().email().max(254),
  visitorPhone: optionalString.pipe(z.string().max(20).optional()),
  message: optionalString.pipe(z.string().max(2000).optional()),
  preferredContactMethod: z.enum(['EMAIL', 'PHONE', 'WHATSAPP']),
  inquiryType: z.enum(['BUY', 'RENT', 'VALUATION', 'GENERAL']),
  source: z.enum(['PROPERTY_PAGE', 'AGENT_PAGE', 'CONTACT_PAGE', 'DIRECT']),
  property: optionalString.pipe(z.string().max(40).optional()),
  agent: optionalString.pipe(z.string().max(40).optional()),
  idempotencyKey: z.string().min(16).max(200),
});

const visitSchema = z.object({
  property: z.string().min(12).max(40),
  agent: optionalString.pipe(z.string().max(40).optional()),
  visitorName: z.string().trim().min(2).max(100),
  visitorEmail: z.string().trim().email().max(254),
  visitorPhone: optionalString.pipe(z.string().max(20).optional()),
  requestedStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  visitType: z.enum(['IN_PERSON', 'PRIVATE_VIDEO_TOUR']),
  notes: optionalString.pipe(z.string().max(1000).optional()),
  idempotencyKey: z.string().min(16).max(200),
});

async function requestContext() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || requestHeaders.get('x-real-ip') || 'unknown';
  const secret = process.env.RATE_LIMIT_SALT ?? process.env.NEXTAUTH_SECRET;
  return {
    correlationId: crypto.randomUUID(),
    ...(secret ? { ipHash: hashIp(ip, secret) } : {}),
  };
}

function errorState(error: unknown): PublicFormState {
  if (error instanceof ServiceError) {
    return { status: 'error', message: error.message };
  }
  console.error('[public-form] Submission failed:', error);
  return {
    status: 'error',
    message: 'We could not send this request. Please try again shortly.',
  };
}

export async function submitLead(
  _previousState: PublicFormState,
  formData: FormData
): Promise<PublicFormState> {
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please check your name, email, and message before sending.',
    };
  }

  try {
    await createLead(parsed.data, await requestContext());
    return {
      status: 'success',
      message: 'Thank you. A Northstone advisor will be in touch shortly.',
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function submitVisit(
  _previousState: PublicFormState,
  formData: FormData
): Promise<PublicFormState> {
  const parsed = visitSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please complete your contact details and choose a visit time.',
    };
  }

  try {
    const requestedStart = new Date(parsed.data.requestedStart + ':00+05:30');
    if (!Number.isFinite(requestedStart.getTime())) {
      return { status: 'error', message: 'Please choose a valid visit time.' };
    }
    const result = await createVisit(
      { ...parsed.data, requestedStart },
      await requestContext()
    );
    return {
      status: 'success',
      message: result.message || 'Your visit request has been received.',
    };
  } catch (error) {
    return errorState(error);
  }
}
