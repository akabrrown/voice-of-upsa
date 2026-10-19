import assert from "node:assert";

// Implementations matching lib/comments/guest-identity.ts
const RESERVED_STAFF_NAMES = [
  "admin",
  "administrator",
  "moderator",
  "editor",
  "upsa staff",
  "voice of upsa",
  "upsa official",
  "editorial team",
  "system",
  "verified staff",
  "head of content",
];

function isReservedName(name) {
  if (!name) return false;
  const normalized = name.trim().toLowerCase();
  return RESERVED_STAFF_NAMES.some(
    (reserved) => normalized === reserved || normalized.startsWith(reserved + " ") || normalized.endsWith(" " + reserved)
  );
}

function generateGuestDiscriminator(guestId) {
  if (!guestId) return "#0001";
  let hash = 0;
  for (let i = 0; i < guestId.length; i++) {
    hash = (hash << 5) - hash + guestId.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  const num = (positive % 9000) + 1000;
  return `#${num}`;
}

const GUEST_ENVELOPE_PREFIX = "<!--vou-guest:";
const GUEST_ENVELOPE_SUFFIX = "-->";

function formatGuestCommentContent(text, guest) {
  const metadata = {
    n: guest.name.trim().slice(0, 50),
    g: guest.guestId,
    b: guest.badge,
  };
  const jsonMeta = JSON.stringify(metadata);
  return `${GUEST_ENVELOPE_PREFIX}${jsonMeta}${GUEST_ENVELOPE_SUFFIX}\n${text.trim()}`;
}

function parseCommentContent(rawContent) {
  if (!rawContent || typeof rawContent !== "string") {
    return {
      isGuest: false,
      authorName: "Editorial Reader",
      cleanContent: "",
    };
  }

  if (rawContent.startsWith(GUEST_ENVELOPE_PREFIX)) {
    const endIdx = rawContent.indexOf(GUEST_ENVELOPE_SUFFIX);
    if (endIdx !== -1) {
      const jsonStr = rawContent.slice(GUEST_ENVELOPE_PREFIX.length, endIdx);
      const cleanContent = rawContent.slice(endIdx + GUEST_ENVELOPE_SUFFIX.length).trim();
      try {
        const meta = JSON.parse(jsonStr);
        const guestId = meta.g || "";
        const badge = meta.b || generateGuestDiscriminator(guestId);

        return {
          isGuest: true,
          authorName: meta.n || "Guest Reader",
          guestId: guestId || null,
          guestBadge: badge,
          cleanContent,
        };
      } catch {
        return {
          isGuest: true,
          authorName: "Guest Reader",
          cleanContent,
        };
      }
    }
  }

  return {
    isGuest: false,
    authorName: "Editorial Reader",
    cleanContent: rawContent,
  };
}

// 1. Discriminator determinism
const dev1 = "e6c0f6ef-a3ad-4e58-94ff-d9ffad825cbb";
const d1 = generateGuestDiscriminator(dev1);
const d2 = generateGuestDiscriminator(dev1);
assert.strictEqual(d1, d2, "Discriminator must be deterministic for identical deviceId");
assert.match(d1, /^#[1-9]\d{3}$/, "Discriminator must follow #XXXX format");

// 2. Discriminator variation
const dev2 = "b845ef20-1982-4f91-8843-c0201bcbb891";
const d3 = generateGuestDiscriminator(dev2);
assert.notStrictEqual(d1, d3, "Different devices should generate distinct discriminators");

// 3. Security impersonation detection
assert.strictEqual(isReservedName("Admin"), true);
assert.strictEqual(isReservedName("upsa official"), true);
assert.strictEqual(isReservedName("editor John"), true);
assert.strictEqual(isReservedName("Kofi Official"), false);
assert.strictEqual(isReservedName("Kwame Mensah"), false);

// 4. Envelope formatting and parsing
const message = "Great point about the campus transport! #VOU";
const guestInfo = {
  name: "Kofi Mensah",
  guestId: dev1,
  badge: d1,
};

const formatted = formatGuestCommentContent(message, guestInfo);
assert(formatted.startsWith(GUEST_ENVELOPE_PREFIX), "Formatted string must start with envelope prefix");

const parsed = parseCommentContent(formatted);
assert.strictEqual(parsed.isGuest, true);
assert.strictEqual(parsed.authorName, "Kofi Mensah");
assert.strictEqual(parsed.guestId, dev1);
assert.strictEqual(parsed.guestBadge, d1);
assert.strictEqual(parsed.cleanContent, message);

// 5. Plain text comment fallback (registered user format)
const plainMessage = "This is a regular comment from an authenticated user.";
const parsedPlain = parseCommentContent(plainMessage);
assert.strictEqual(parsedPlain.isGuest, false);
assert.strictEqual(parsedPlain.cleanContent, plainMessage);

console.log("All guest identity and security checks passed successfully!");
