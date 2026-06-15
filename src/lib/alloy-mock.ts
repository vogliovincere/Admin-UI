export type AlloyTagLabel = "Name" | "Address" | "TaxId" | "DOB";

export interface AlloyTag {
  label: AlloyTagLabel;
  match: boolean;
}

export interface AlloyResult {
  score: number;
  tags: AlloyTag[];
}

/**
 * Alloy KYC/KYB decision statuses surfaced to the admin application view.
 * These mirror the values the Alloy response payload can carry.
 */
export type AlloyKycStatus =
  | "Approved"
  | "Denied"
  | "Manual Review"
  | "Submitted"
  | "Enhanced Due Diligence"
  | "Pending";

// EntityKycStatus retained as an alias for existing callers.
export type EntityKycStatus = AlloyKycStatus;

/**
 * NEW DECISIONING MODEL: tags from the Alloy response are only meaningful when
 * the entity has reached a decision-bearing status. Tags appear ONLY when the
 * status is one of these; otherwise the admin view shows no tags.
 */
export const ALLOY_TAG_VISIBLE_STATUSES: readonly AlloyKycStatus[] = [
  "Manual Review",
  "Submitted",
  "Approved",
  "Denied",
  "Enhanced Due Diligence",
];

export function alloyTagsVisible(status: AlloyKycStatus): boolean {
  return ALLOY_TAG_VISIBLE_STATUSES.includes(status);
}

/**
 * Returns the KYC/KYB decision status for the given application entity.
 *
 * PRODUCTION NOTE: In production this value is obtained via an API call to the
 * KYC Microservice (e.g. GET /kyc/entities/{appId}/status). In this demo it is
 * mocked in-memory using a deterministic hash of the application ID.
 */
export function getEntityKycStatus(appId: string): AlloyKycStatus {
  const h = hashString(appId || "unknown");
  const statuses: AlloyKycStatus[] = [
    "Approved",
    "Approved",
    "Manual Review",
    "Submitted",
    "Enhanced Due Diligence",
    "Denied",
    "Pending",
  ];
  return statuses[h % statuses.length];
}

/**
 * Returns the Alloy tags to display for an application, GATED by status.
 * Per the new decisioning model, tags are only returned when the status is a
 * decision-bearing one (see ALLOY_TAG_VISIBLE_STATUSES); otherwise [].
 */
export function getVisibleAlloyTags(
  status: AlloyKycStatus,
  tags: string[] | undefined
): string[] {
  if (!alloyTagsVisible(status)) return [];
  return tags ?? [];
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

const LABELS: AlloyTagLabel[] = ["Name", "Address", "TaxId", "DOB"];

export function getAlloyResultForPerson(personId: string): AlloyResult {
  const h = hashString(personId || "anon");

  // Decide mismatch count: most persons all-match. ~60% all match, ~30% 1 mismatch, ~10% 2 mismatch.
  const bucket = h % 10;
  let mismatchCount = 0;
  if (bucket < 6) mismatchCount = 0;
  else if (bucket < 9) mismatchCount = 1;
  else mismatchCount = 2;

  // Pick which labels are mismatches deterministically
  const mismatchIndices = new Set<number>();
  let cursor = h;
  while (mismatchIndices.size < mismatchCount) {
    cursor = (cursor * 1103515245 + 12345) >>> 0;
    mismatchIndices.add(cursor % LABELS.length);
  }

  const tags: AlloyTag[] = LABELS.map((label, i) => ({
    label,
    match: !mismatchIndices.has(i),
  }));

  // Score: high if all match (90-98), lower if mismatches
  let score: number;
  if (mismatchCount === 0) {
    score = 90 + (h % 9); // 90-98
  } else if (mismatchCount === 1) {
    score = 75 + (h % 11); // 75-85
  } else {
    score = 60 + (h % 11); // 60-70
  }

  return { score, tags };
}
