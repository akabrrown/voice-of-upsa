/**
 * Defense-in-depth Disposable & Temporary Email Blocker
 * Voice of UPSA Security Architecture
 */

import { createRequire } from "module";

const nodeRequire = typeof createRequire === "function" 
  ? createRequire(import.meta.url) 
  : (typeof require === "function" ? require : null);

let disposableDomainsList: string[] = [];
try {
  if (nodeRequire) {
    disposableDomainsList = nodeRequire("disposable-email-domains");
  }
} catch {
  disposableDomainsList = [];
}

// Additional disposable domains commonly used by throwaway services
const ADDITIONAL_DISPOSABLE_DOMAINS = [
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "tempmail.net",
  "tempmail.ninja",
  "mohmal.com",
  "inboxkitten.com",
  "burnermail.io",
  "crazymailing.com",
  "throwawaymail.com",
  "throwawaymail.net",
  "fakeinbox.com",
  "fakemail.net",
  "emailondeck.com",
  "generator.email",
  "10mail.org",
  "10minutemail.net",
  "10minutemail.co.uk",
  "tempinbox.com",
  "mytemp.email",
  "disposablemail.com",
  "guerrillamailblock.com",
  "guerrillamail.biz",
  "guerrillamail.org",
  "guerrillamail.info",
  "sharklasers.com",
  "grr.la",
  "pokemail.net",
  "spam4.me",
  "yopmail.fr",
  "yopmail.net",
  "cool.fr.nf",
  "jetable.fr.nf",
  "nospam.ze.tc",
  "nomail.xl.cx",
  "mega.zik.dj",
  "speed.1s.fr",
  "courriel.fr.nf",
  "moncourrier.fr.nf",
  "monemail.fr.nf",
  "monmail.fr.nf",
  "mailcatch.com",
  "maildrop.cc",
  "mailnull.com",
  "nada.ltd",
  "getnada.com",
  "abacusmail.com",
  "trashmail.com",
  "trashmail.net",
  "trashmail.org",
  "trashmail.me",
  "dispostable.com",
  "harakirimail.com",
  "dropmail.me",
  "inboxbear.com",
  "chacuo.net",
];

// O(1) lookup set for maximum performance
const DISPOSABLE_DOMAINS_SET: Set<string> = new Set([
  ...(Array.isArray(disposableDomainsList) ? disposableDomainsList.map((d: string) => d.toLowerCase().trim()) : []),
  ...ADDITIONAL_DISPOSABLE_DOMAINS.map((d: string) => d.toLowerCase().trim()),
]);

// Suspicious disposable keyword patterns in domain names
const DISPOSABLE_DOMAIN_PATTERNS = [
  /temp.*mail/i,
  /dispos.*mail/i,
  /throw.*away.*mail/i,
  /fake.*inbox/i,
  /trash.*mail/i,
  /sharklasers/i,
  /guerrilla.*mail/i,
  /mohmal/i,
  /burner.*mail/i,
  /inboxkitten/i,
  /10.*minute.*mail/i,
  /10minutemail/i,
  /generator.*email/i,
  /instant.*disposable/i,
];

export interface DisposableEmailCheckResult {
  isDisposable: boolean;
  reason?: string;
  domain?: string;
}

/**
 * Checks whether an email address uses a temporary or disposable domain.
 * Supports exact matches, subdomain recursion (e.g. sub.mailinator.com), and heuristic keyword matching.
 */
export function isDisposableEmail(email: string | null | undefined): DisposableEmailCheckResult {
  if (!email || typeof email !== "string") {
    return { isDisposable: true, reason: "Email address is required." };
  }

  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split("@");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { isDisposable: true, reason: "Invalid email format." };
  }

  const domain = parts[1].toLowerCase().trim();

  // 1. Check exact domain match
  if (DISPOSABLE_DOMAINS_SET.has(domain)) {
    return {
      isDisposable: true,
      domain,
      reason: "Disposable and temporary email addresses are not permitted. Please use a permanent email address.",
    };
  }

  // 2. Check parent domains (e.g. sub.domain.mailinator.com -> mailinator.com)
  const domainParts = domain.split(".");
  for (let i = 1; i < domainParts.length - 1; i++) {
    const parentDomain = domainParts.slice(i).join(".");
    if (DISPOSABLE_DOMAINS_SET.has(parentDomain)) {
      return {
        isDisposable: true,
        domain,
        reason: "Disposable and temporary email addresses are not permitted. Please use a permanent email address.",
      };
    }
  }

  // 3. Check suspicious disposable keyword patterns
  for (const pattern of DISPOSABLE_DOMAIN_PATTERNS) {
    if (pattern.test(domain)) {
      return {
        isDisposable: true,
        domain,
        reason: "Disposable and temporary email addresses are not permitted. Please use a permanent email address.",
      };
    }
  }

  return { isDisposable: false, domain };
}
