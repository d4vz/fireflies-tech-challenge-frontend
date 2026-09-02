"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  useStickToBottomContext,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Suggestion } from "@/components/ai-elements/suggestion";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ASK_FRED_PLACEHOLDER,
  askFredMeetingPath,
  isAskFredBusy,
  shouldScrollFredStick,
  type FredStickSnapshot,
} from "@lib/ask-fred";
import { WORKSPACE_NAME } from "@lib/chrome";
import type { UseChatHelpers } from "@ai-sdk/react";
import { isDynamicToolUIPart, isStaticToolUIPart, type UIMessage } from "ai";
import { CornerDownLeft } from "lucide-react";
import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import type { Components } from "streamdown";

const CHIPS = ["What's my day looking like?", "Pending tasks across all meetings"];
const GREETING = `Hi ${WORKSPACE_NAME}! Get ready for your meeting.`;
const FRED_LINK_SAFETY = { enabled: false };

type FredMarkdownLinkProps = {
  href?: string;
  className?: string;
  children?: ReactNode;
};

function FredMarkdownLink(props: FredMarkdownLinkProps) {
  const href = props.href ?? "";
  const path = askFredMeetingPath(href, window.location.origin);
  if (path !== undefined) {
    return (
      <a className={props.className} href={path}>
        {props.children}
      </a>
    );
  }
  return (
    <a className={props.className} href={href} rel="noreferrer" target="_blank">
      {props.children}
    </a>
  );
}

const FRED_MARKDOWN_COMPONENTS = {
  // SAFETY: Streamdown types every markdown tag as Record<string, unknown>; this link only reads href, className, and children.
  a: FredMarkdownLink as Components["a"],
};

function rewriteFredUrl(url: string) {
  return askFredMeetingPath(url, window.location.origin) ?? url;
}

function FredMarkdown(props: { children: string; streaming?: boolean }) {
  const streaming = props.streaming === true;
  return (
    <MessageResponse
      className="wrap-break-word"
      components={FRED_MARKDOWN_COMPONENTS}
      isAnimating={streaming}
      linkSafety={FRED_LINK_SAFETY}
      mode={streaming ? "streaming" : "static"}
      parseIncompleteMarkdown={streaming}
      urlTransform={rewriteFredUrl}
    >
      {props.children}
    </MessageResponse>
  );
}

function isLiveFredMessage(
  message: UIMessage,
  last: UIMessage | undefined,
  busy: boolean,
): boolean {
  return busy && last !== undefined && message.id === last.id && message.role === "assistant";
}

export type AskFredProps = Pick<UseChatHelpers<UIMessage>, "messages" | "sendMessage" | "status">;

function FredToolPart(props: { part: UIMessage["parts"][number] }) {
  const part = props.part;
  if (isDynamicToolUIPart(part)) {
    return (
      <Tool>
        <ToolHeader type={part.type} state={part.state} toolName={part.toolName} />
        <ToolContent>
          {part.input !== undefined ? <ToolInput input={part.input} /> : null}
          <ToolOutput errorText={part.errorText} output={part.output} />
        </ToolContent>
      </Tool>
    );
  }
  if (!isStaticToolUIPart(part)) {
    return null;
  }
  return (
    <Tool>
      <ToolHeader type={part.type} state={part.state} />
      <ToolContent>
        {part.input !== undefined ? <ToolInput input={part.input} /> : null}
        <ToolOutput errorText={part.errorText} output={part.output} />
      </ToolContent>
    </Tool>
  );
}

function FredMessage(props: { message: UIMessage; streaming: boolean }) {
  return (
    <Message from={props.message.role}>
      <MessageContent>
        {props.message.parts.map((part, index) => {
          if (part.type === "text") {
            return (
              <FredMarkdown key={`${props.message.id}-${index}`} streaming={props.streaming}>
                {part.text}
              </FredMarkdown>
            );
          }
          return <FredToolPart key={`${props.message.id}-${index}`} part={part} />;
        })}
      </MessageContent>
    </Message>
  );
}

function stickKey(messages: UIMessage[]): string {
  const last = messages.at(-1);
  if (last === undefined) {
    return "";
  }
  const text = last.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
  return `${messages.length}:${last.id}:${text.length}`;
}

function FredStick(props: { messages: UIMessage[]; force: boolean }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();
  const key = stickKey(props.messages);
  const previous = useRef<FredStickSnapshot | undefined>(undefined);
  const atBottom = useRef(isAtBottom);
  const scroll = useRef(scrollToBottom);
  atBottom.current = isAtBottom;
  scroll.current = scrollToBottom;
  useEffect(() => {
    const next: FredStickSnapshot = { force: props.force, isAtBottom: atBottom.current, key };
    if (shouldScrollFredStick(previous.current, next)) {
      void scroll.current();
    }
    previous.current = next;
  }, [key, props.force]);
  return null;
}

function FredComposer(props: { busy: boolean; onSend: (text: string) => void }) {
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (props.busy) {
      return;
    }
    const data = new FormData(event.currentTarget);
    props.onSend(String(data.get("message") ?? ""));
    event.currentTarget.reset();
  }

  return (
    <form className="flex shrink-0 items-center gap-2 border-t border-line p-3" onSubmit={onSubmit}>
      <Input
        aria-label="Ask Fred"
        autoComplete="off"
        className="min-w-0 flex-1"
        name="message"
        placeholder={ASK_FRED_PLACEHOLDER}
      />
      <Button
        aria-label="Send"
        className="size-8 rounded-full"
        disabled={props.busy}
        size="icon"
        type="submit"
      >
        <CornerDownLeft className="size-4" />
      </Button>
    </form>
  );
}

export function AskFred(props: AskFredProps) {
  const busy = isAskFredBusy(props.status);
  const last = props.messages.at(-1);

  function send(text: string) {
    const trimmed = text.trim();
    if (trimmed === "" || busy) {
      return;
    }
    void props.sendMessage({ text: trimmed });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation className="min-h-0 flex-1" initial="smooth" resize="smooth">
        <FredStick force={busy} messages={props.messages} />
        <ConversationContent className="px-4 py-4" scrollClassName="h-full min-h-0 overflow-y-auto">
          <Message from="assistant">
            <MessageContent>
              <FredMarkdown>{GREETING}</FredMarkdown>
            </MessageContent>
          </Message>
          {props.messages.map((message) => (
            <FredMessage
              key={message.id}
              message={message}
              streaming={isLiveFredMessage(message, last, busy)}
            />
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="flex flex-wrap gap-2 px-4 py-2">
        {CHIPS.map((chip) => (
          <Suggestion
            className="h-auto max-w-full py-1.5 text-left whitespace-normal"
            key={chip}
            onClick={send}
            suggestion={chip}
          />
        ))}
      </div>
      <FredComposer busy={busy} onSend={send} />
    </div>
  );
}
