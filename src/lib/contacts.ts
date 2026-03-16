import * as Contacts from 'expo-contacts';

export interface PhoneContact {
  name: string;
  phone: string;
}

// Request contacts permission
export async function requestContactsPermission(): Promise<boolean> {
  const { status } = await Contacts.requestPermissionsAsync();
  return status === 'granted';
}

// Get all contacts with phone numbers
export async function getPhoneContacts(): Promise<PhoneContact[]> {
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
  });

  const contacts: PhoneContact[] = [];
  for (const contact of data) {
    if (!contact.phoneNumbers || !contact.name) continue;
    for (const phone of contact.phoneNumbers) {
      if (phone.number) {
        const normalized = normalizePhoneNumber(phone.number);
        if (normalized) {
          contacts.push({ name: contact.name, phone: normalized });
        }
      }
    }
  }

  // Deduplicate by phone number
  const seen = new Set<string>();
  return contacts.filter(c => {
    if (seen.has(c.phone)) return false;
    seen.add(c.phone);
    return true;
  });
}

// Normalize Korean phone numbers to +82 format
export function normalizePhoneNumber(phone: string): string | null {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Korean mobile: 010-XXXX-XXXX
  if (cleaned.startsWith('010')) {
    cleaned = '+82' + cleaned.substring(1);
  } else if (cleaned.startsWith('+82')) {
    // Already normalized
  } else if (cleaned.startsWith('82')) {
    cleaned = '+' + cleaned;
  } else {
    return null; // Not a Korean number
  }

  // Validate length (+82 10 XXXX XXXX = 13 digits with +82)
  if (cleaned.length < 12 || cleaned.length > 13) return null;

  return cleaned;
}
