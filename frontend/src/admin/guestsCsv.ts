import {
  type AdminParticipationStatus,
  type EventParticipant,
  formatEventDate,
  formatEventTime,
} from "../api/events";

const STATUS_LABEL: Record<AdminParticipationStatus, string> = {
  registered: "Going",
  pending: "Pending",
  declined: "Declined",
  cancelled: "Cancelled",
};

const HEADER = [
  "Name",
  "Username",
  "Email",
  "Phone",
  "Status",
  "Signed up",
  "Checked in at",
];

// Quotes every cell. A cell that starts with = + - @ (or a tab / carriage return)
// gets a leading ' so a spreadsheet never runs it as a formula.
function cell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function dateTime(iso: string): string {
  return `${formatEventDate(iso)} ${formatEventTime(iso)}`;
}

export function buildGuestsCsv(rows: EventParticipant[]): string {
  const lines = [HEADER.map(cell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.user.name,
        r.user.username,
        r.user.email,
        r.user.phone,
        STATUS_LABEL[r.status],
        dateTime(r.registeredAt),
        r.checkedInAt ? dateTime(r.checkedInAt) : "",
      ]
        .map(cell)
        .join(",")
    );
  }
  return lines.join("\r\n");
}

export function downloadGuestsCsv(slug: string, rows: EventParticipant[]): void {
  // The BOM makes Excel read the file as UTF-8.
  const blob = new Blob(["\uFEFF", buildGuestsCsv(rows)], {
    type: "text/csv;charset=utf-8",
  });
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `guests-${slug}-${today}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}