"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { AskFredProps } from "@components/ask-fred";
import { Sparkles, X } from "@animateicons/react/lucide";
import dynamic from "next/dynamic";
import type { IconHandle } from "@animateicons/react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRef } from "react";
import { AssistantOverlay } from "@components/assistant-overlay";
import { Button } from "@/components/ui/button";
import { handleHover } from "@lib/handle-hover";
import { displayNameFrom } from "@lib/chrome";
import { useAssistantPresence, type AssistantPresenceClick } from "@/hooks/use-assistant-presence";

const AskFred = dynamic(() => import("@components/ask-fred").then((mod) => mod.AskFred), {
  ssr: false,
});

function AskFredPanel(
  props: {
    closeHref: string;
    onCloseClick: (event: AssistantPresenceClick) => void;
  } & AskFredProps,
) {
  const closeRef = useRef<IconHandle>(null);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2 text-[0.95rem] font-semibold text-accent">
          <Sparkles size={16} />
          AskFred
        </div>
        <Button asChild variant="ghost" size="icon-sm">
          <Link
            href={props.closeHref}
            aria-label="Close AskFred"
            onMouseEnter={(event) => handleHover(event, closeRef)}
            onMouseLeave={(event) => handleHover(event, closeRef)}
            onClick={props.onCloseClick}
          >
            <X ref={closeRef} size={16} />
          </Link>
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <AskFred
          displayName={props.displayName}
          error={props.error}
          messages={props.messages}
          sendMessage={props.sendMessage}
          status={props.status}
        />
      </div>
    </div>
  );
}

export function AssistantHost() {
  const assistant = useAssistantPresence();
  const { user } = useUser();
  const displayName = displayNameFrom(user?.firstName, user?.primaryEmailAddress?.emailAddress);
  const { error, messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ask-fred" }),
  });
  return (
    <AssistantOverlay open={assistant.open} onClose={assistant.close}>
      {assistant.open ? (
        <AskFredPanel
          closeHref={assistant.closeHref}
          onCloseClick={assistant.onCloseClick}
          displayName={displayName}
          error={error}
          messages={messages}
          sendMessage={sendMessage}
          status={status}
        />
      ) : null}
    </AssistantOverlay>
  );
}
