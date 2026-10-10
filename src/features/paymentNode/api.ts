import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type { UserRole } from '../../types';

// Profile → Payment Node: the user's payout bank account.
//   Admin: GET / POST / PATCH / DELETE /admin/payment-node
//   Host:  GET / POST / PATCH / DELETE /host/payment-node
// GET returns { data: node | null }. POST creates, PATCH updates.

export interface PaymentNode {
  _id: string;
  bankName: string;
  accountHolderName: string;
  accountHolderNameUpper?: string;
  ibanNumber: string;
  formattedIban?: string;
  maskedIban?: string;
  maskedIbanFull?: string;
  last4?: string;
  settlementCurrency: string;
  railConfiguration?: string | null;
  treasuryStatus?: string | null;
  isVerified?: boolean;
  swiftCode?: string;
  routingCode?: string;
  accountNumber?: string; // admin only
  updatedAt?: string;
}

export interface PaymentNodeInput {
  bankName: string;
  accountHolderName: string;
  ibanNumber: string;
  settlementCurrency?: string;
  swiftCode?: string;
  routingCode?: string;
  accountNumber?: string; // admin only
}

const url = (role: UserRole) => (role === 'admin' ? API_ENDPOINTS.paymentNode.admin : API_ENDPOINTS.paymentNode.host);

const clean = (input: PaymentNodeInput, role: UserRole) => {
  const body: Record<string, string> = {
    bankName: input.bankName.trim(),
    accountHolderName: input.accountHolderName.trim(),
    ibanNumber: input.ibanNumber.replace(/\s+/g, '').toUpperCase(),
  };
  if (input.settlementCurrency) body.settlementCurrency = input.settlementCurrency;
  if (input.swiftCode?.trim()) body.swiftCode = input.swiftCode.trim().toUpperCase();
  if (input.routingCode?.trim()) body.routingCode = input.routingCode.trim();
  if (role === 'admin' && input.accountNumber?.trim()) body.accountNumber = input.accountNumber.trim();
  return body;
};

// null when no payout destination has been saved yet.
export async function getPaymentNode(role: UserRole): Promise<PaymentNode | null> {
  try {
    const { data } = await apiClient.get<ApiSuccessEnvelope<PaymentNode | null>>(url(role));
    const node = data?.data ?? null;
    return node && typeof node === 'object' && (node as PaymentNode).bankName ? (node as PaymentNode) : null;
  } catch (err) {
    if ((err as { statusCode?: number })?.statusCode === 404) return null;
    throw err;
  }
}

export async function savePaymentNode(role: UserRole, input: PaymentNodeInput, exists: boolean): Promise<PaymentNode | null> {
  const body = clean(input, role);
  const { data } = exists
    ? await apiClient.patch<ApiSuccessEnvelope<PaymentNode>>(url(role), body)
    : await apiClient.post<ApiSuccessEnvelope<PaymentNode>>(url(role), body);
  return data?.data ?? null;
}

export async function deletePaymentNode(role: UserRole): Promise<void> {
  await apiClient.delete(url(role));
}
