import { connectDB } from './mongodb';
import University from '../models/University';
import { getEmailDomain } from './utils';
import { IUniversity } from '../types';

/**
 * Check if an email belongs to a recognized university.
 * Returns the matching University document or null.
 */
export async function findUniversityByEmail(email: string): Promise<IUniversity | null> {
  await connectDB();
  const domain = getEmailDomain(email);
  if (!domain) return null;
  return University.findOne({ domains: domain, isActive: true }).lean();
}
