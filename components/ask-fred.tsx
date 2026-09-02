"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  useStickToBottomContext,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
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
  isAskFredBusy,
  shouldScrollFredStick,
  shouldShowFredPending,
  shouldShowFredSuggestions,
  type FredStickSnapshot,
} from "@lib/ask-fred";
import type { UseChatHelpers } from "@ai-sdk/react";
import { isDynamicToolUIPart, isStaticToolUIPart, type UIMessage } from "ai";
import { CornerDownLeft } from "lucide-react";
import { useEffect, useRef, type FormEvent } from "react";

const CHIPS = ["What's my day looking like?", "Pending tasks across all meetings"];

function FredMarkdown(props: { children: string; streaming?: boolean }) {
  const streaming = props.streaming === true;
  return (
    <MessageResponse
      className="h-auto w-full wrap-break-word"
      isAnimating={streaming}
      linkSafety={{ enabled: false }}
      mode={streaming ? "streaming" : "static"}
      parseIncompleteMarkdown={streaming}
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

function hasVisibleFredParts(message: UIMessage): boolean {
  return message.parts.some((part) => {
    if (part.type === "text") {
      return part.text.trim() !== "";
    }
    return isDynamicToolUIPart(part) || isStaticToolUIPart(part);
  });
}

export type AskFredProps = Pick<
  UseChatHelpers<UIMessage>,
  "error" | "messages" | "sendMessage" | "status"
> & {
  displayName: string;
};

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
            if (part.text.trim() === "") {
              return null;
            }
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
  const { scrollToBottom, state } = useStickToBottomContext();
  const key = stickKey(props.messages);
  const previous = useRef<FredStickSnapshot | undefined>(undefined);
  const atBottom = useRef(state.isAtBottom);
  const scroll = useRef(scrollToBottom);
  atBottom.current = state.isAtBottom;
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
  const showSuggestions = shouldShowFredSuggestions(props.messages);

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
              <FredMarkdown>{`Hi ${props.displayName}! Get ready for your meeting.`}</FredMarkdown>
            </MessageContent>
          </Message>
          {props.messages.map((message) =>
            hasVisibleFredParts(message) ? (
              <FredMessage
                key={message.id}
                message={message}
                streaming={isLiveFredMessage(message, last, busy)}
              />
            ) : null,
          )}
          {shouldShowFredPending(props.status, last) ? (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking...</Shimmer>
              </MessageContent>
            </Message>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      {showSuggestions ? (
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
      ) : null}
      {props.error !== undefined ? (
        <p className="px-4 pb-2 text-[0.85rem] text-danger">{props.error.message}</p>
      ) : null}
      <FredComposer busy={busy} onSend={send} />
    </div>
  );
}
