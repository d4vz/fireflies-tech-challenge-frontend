export type SpeakerLook = {
  name: string;
  initial: string;
  background: string;
};

const AVATAR_COLORS = ["#7BC67E", "#E8A838", "#6B9FE8", "#D67BB0", "#6B4DFF"] as const;

function isLetterId(id: string) {
  return /^[A-Za-z]$/.test(id);
}

export function speakerLook(looks: Map<string, SpeakerLook>, id: string): SpeakerLook {
  const look = looks.get(id);
  if (look === undefined) {
    throw new Error(`unknown speaker ${id}`);
  }
  return look;
}

export function speakerLooks(speakerIds: readonly string[]): Map<string, SpeakerLook> {
  const looks = new Map<string, SpeakerLook>();
  let ordinal = 0;
  for (const id of speakerIds) {
    if (looks.has(id)) {
      continue;
    }
    ordinal += 1;
    const name = isLetterId(id) ? `Speaker ${ordinal}` : id;
    const initial = isLetterId(id) ? "S" : name.trim().charAt(0).toUpperCase() || "?";
    const background = AVATAR_COLORS[(ordinal - 1) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
    looks.set(id, { name, initial, background });
  }
  return looks;
}
