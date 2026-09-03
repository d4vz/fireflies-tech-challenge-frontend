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
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  ASK_FRED_PLACEHOLDER,
  isAskFredBusy,
  shouldScrollFredStick,
  shouldShowFredPending,
  shouldShowFredSuggestions,
  type FredStickSnapshot,
} from "@lib/ask-fred";
import type { UseChatHelpers } from "@ai-sdk/react";
import { ArrowUp, ListChecks, Sparkles } from "@animateicons/react/lucide";
import type { IconHandle } from "@animateicons/react";
import { isDynamicToolUIPart, isStaticToolUIPart, type UIMessage } from "ai";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { handleHover } from "@lib/handle-hover";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CHIPS = ["What's my day looking like?", "Pending tasks across all meetings"] as const;

const CHIP_ICONS = {
  "What's my day looking like?": Sparkles,
  "Pending tasks across all meetings": ListChecks,
} as const;

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
      <MessageContent className={props.message.role === "user" ? "bg-process-wash" : undefined}>
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

function FredComposer(props: {
  busy: boolean;
  onSend: (text: string) => void;
  status: AskFredProps["status"];
}) {
  const sendRef = useRef<IconHandle>(null);

  function onSubmit(message: PromptInputMessage) {
    if (props.busy) {
      return;
    }
    props.onSend(message.text);
  }

  return (
    <PromptInput
      className="shrink-0 p-3 [&_[data-slot=input-group]]:rounded-[10px] [&_[data-slot=input-group]]:border-line [&_[data-slot=input-group]]:bg-paper [&_[data-slot=input-group]]:focus-within:border-accent [&_[data-slot=input-group]]:focus-within:ring-2 [&_[data-slot=input-group]]:focus-within:ring-accent/30 [&:has(textarea:not(:placeholder-shown))_[aria-label=Send]]:bg-accent [&:has(textarea:not(:placeholder-shown))_[aria-label=Send]]:text-white [&:has(textarea:not(:placeholder-shown))_[aria-label=Send]]:hover:bg-accent-hover [&:has(textarea:not(:placeholder-shown))_[aria-label=Send]]:hover:text-white"
      onSubmit={onSubmit}
    >
      <PromptInputTextarea
        aria-label="Ask Fred"
        autoComplete="off"
        placeholder={ASK_FRED_PLACEHOLDER}
      />
      <PromptInputFooter className="justify-end">
        <PromptInputSubmit
          aria-label="Send"
          className="rounded-lg bg-process-wash text-accent hover:bg-process-wash hover:text-accent"
          status={props.status}
          onMouseEnter={(event) => handleHover(event, sendRef)}
          onMouseLeave={(event) => handleHover(event, sendRef)}
        >
          <ArrowUp ref={sendRef} size={16} />
        </PromptInputSubmit>
      </PromptInputFooter>
    </PromptInput>
  );
}

function FredChip(props: { chip: (typeof CHIPS)[number]; onSend: (text: string) => void }) {
  const iconRef = useRef<IconHandle>(null);
  const Icon = CHIP_ICONS[props.chip];
  return (
    <Suggestion
      className="surface-card-hover h-auto w-full justify-start gap-2 rounded-[10px] p-3 text-left whitespace-normal"
      onClick={props.onSend}
      onMouseEnter={(event) => handleHover(event, iconRef)}
      onMouseLeave={(event) => handleHover(event, iconRef)}
      suggestion={props.chip}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-process-wash text-accent">
        <Icon ref={iconRef} size={16} />
      </span>
      {props.chip}
    </Suggestion>
  );
}

function FredSuggestions(props: { open: boolean; onSend: (text: string) => void }) {
  const reduceMotion = useReducedMotion();
  const transition =
    reduceMotion === true ? { duration: 0 } : { duration: 0.22, ease: "easeOut" as const };
  return (
    <AnimatePresence initial={false}>
      {props.open ? (
        <motion.div
          key="fred-suggestions"
          className="flex flex-col items-stretch gap-3 overflow-hidden px-3 pt-3 pb-0"
          initial={false}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={transition}
        >
          {CHIPS.map((chip) => (
            <FredChip chip={chip} key={chip} onSend={props.onSend} />
          ))}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function FredLanding(props: { displayName: string }) {
  return (
    <div className="flex flex-col items-center px-4 pt-10 pb-2 text-center">
      <div className="mb-3 flex items-end gap-1 text-accent">
        <Sparkles className="rise-in [--stagger:0]" size={14} />
        <Sparkles className="rise-in [--stagger:1]" size={22} />
        <Sparkles className="rise-in [--stagger:2]" size={14} />
      </div>
      <h2 className="m-0 text-[1.35rem] font-semibold tracking-tight">{`Hi ${props.displayName}!`}</h2>
      <p className="mt-1 mb-0 text-[0.95rem] text-muted-foreground">Get ready for your meeting.</p>
    </div>
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
      {showSuggestions ? <FredLanding displayName={props.displayName} /> : null}
      <Conversation className="min-h-0 flex-1" initial="smooth" resize="smooth">
        <FredStick force={busy} messages={props.messages} />
        <ConversationContent className="px-4 py-4" scrollClassName="h-full min-h-0 overflow-y-auto">
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
      <FredSuggestions open={showSuggestions && !busy} onSend={send} />
      {props.error !== undefined ? (
        <Alert className="mx-4 mb-2" variant="destructive">
          <AlertDescription>{props.error.message}</AlertDescription>
        </Alert>
      ) : null}
      <FredComposer busy={busy} onSend={send} status={props.status} />
    </div>
  );
}
