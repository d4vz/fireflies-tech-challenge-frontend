import { expect, test } from "bun:test";
import { speakerLook, speakerLooks } from "@lib/speaker-display";

test("letter ids become Speaker 1 and Speaker 2 with an S avatar", () => {
  const looks = speakerLooks(["A", "A", "B"]);
  expect(looks.get("A")).toEqual({
    name: "Speaker 1",
    initial: "S",
    background: "#7BC67E",
  });
  expect(looks.get("B")).toEqual({
    name: "Speaker 2",
    initial: "S",
    background: "#E8A838",
  });
});

test("speakerLook throws when the id was not in the source list", () => {
  expect(() => speakerLook(speakerLooks(["A"]), "B")).toThrow(/unknown speaker B/);
});

test("named speakers keep their label and first letter", () => {
  const looks = speakerLooks(["agent"]);
  expect(looks.get("agent")).toEqual({
    name: "agent",
    initial: "A",
    background: "#7BC67E",
  });
});
