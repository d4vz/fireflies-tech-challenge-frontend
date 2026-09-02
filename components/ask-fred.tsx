"use client";

import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WORKSPACE_NAME } from "@lib/chrome";

export type AssistantMessage = { role: "user"; text: string } | { role: "system"; text: string };

const CHIPS = ["What's my day looking like?", "Pending tasks across all meetings"];

const REPLY =
  "I can prep from the meetings on this page. Ask about a title, a status, or an action item.";

export function AskFred() {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { role: "system", text: `Hi ${WORKSPACE_NAME}! Get ready for your meeting.` },
  ]);
  const [draft, setDraft] = useState("");

  function send(text: string) {
    const trimmed = text.trim();
    if (trimmed === "") {
      return;
    }
    setMessages((current) => [
      ...current,
      { role: "user", text: trimmed },
      { role: "system", text: REPLY },
    ]);
    setDraft("");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(draft);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <ul className="grid gap-3">
          {messages.map((message, index) => (
            <li
              key={`${message.role}-${index}`}
              className={
                message.role === "user"
                  ? "justify-self-end rounded-2xl bg-nav px-3 py-2 text-sm"
                  : "text-sm text-ink"
              }
            >
              {message.text}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {CHIPS.map((chip) => (
            <Button
              key={chip}
              type="button"
              variant="outline"
              className="h-auto rounded-full py-1.5 text-left whitespace-normal"
              onClick={() => send(chip)}
            >
              {chip}
            </Button>
          ))}
        </div>
      </div>
      <form
        className="flex shrink-0 items-center gap-2 border-t border-line p-3"
        onSubmit={onSubmit}
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask anything here or press ⌘J for the full experience"
          aria-label="Ask Fred"
        />
        <Button type="submit" size="icon" aria-label="Send">
          <Send />
        </Button>
      </form>
    </div>
  );
}
