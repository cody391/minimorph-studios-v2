import { ENV } from "./env";

// ── Public types (kept identical to preserve all callers) ──────────────────

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  nativeTools?: Record<string, unknown>[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

// ── Anthropic internal types ───────────────────────────────────────────────

type AnthropicTextBlock = { type: "text"; text: string };
type AnthropicImageBlock = {
  type: "image";
  source:
    | { type: "base64"; media_type: string; data: string }
    | { type: "url"; url: string };
};
type AnthropicToolUseBlock = {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
};
type AnthropicContentBlock = AnthropicTextBlock | AnthropicImageBlock | AnthropicToolUseBlock;

type AnthropicMessage = {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
};

type AnthropicResponse = {
  id: string;
  type: "message";
  role: "assistant";
  content: AnthropicContentBlock[];
  model: string;
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
};

// ── Helpers ────────────────────────────────────────────────────────────────

const ANTHROPIC_MODEL = "claude-sonnet-4-6";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

function assertApiKey(): void {
  if (!ENV.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
}

function extractPlainText(content: MessageContent | MessageContent[]): string {
  const parts = Array.isArray(content) ? content : [content];
  return parts
    .map(p => (typeof p === "string" ? p : p.type === "text" ? p.text : ""))
    .filter(Boolean)
    .join("\n");
}

function toAnthropicContentBlock(part: MessageContent): AnthropicContentBlock | null {
  if (typeof part === "string") return { type: "text", text: part };
  if (part.type === "text") return { type: "text", text: part.text };

  if (part.type === "image_url") {
    const url = part.image_url.url;
    if (url.startsWith("data:")) {
      const commaIdx = url.indexOf(",");
      const meta = url.slice(5, commaIdx); // strip "data:"
      const mediaType = meta.replace(";base64", "");
      const data = url.slice(commaIdx + 1);
      return { type: "image", source: { type: "base64", media_type: mediaType, data } };
    }
    return { type: "image", source: { type: "url", url } };
  }

  if (part.type === "file_url") {
    // Anthropic doesn't support file_url in the same way — skip gracefully
    return { type: "text", text: "[File content cannot be processed in this context]" };
  }

  return null;
}

function toAnthropicMessages(messages: Message[]): {
  system: string;
  messages: AnthropicMessage[];
} {
  const systemParts: string[] = [];
  const result: AnthropicMessage[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemParts.push(extractPlainText(msg.content));
      continue;
    }

    // tool / function responses → user message with plain text
    if (msg.role === "tool" || msg.role === "function") {
      const text = extractPlainText(msg.content);
      result.push({ role: "user", content: text });
      continue;
    }

    const role = msg.role === "assistant" ? "assistant" : "user";
    const parts = Array.isArray(msg.content) ? msg.content : [msg.content];
    const blocks: AnthropicContentBlock[] = [];

    for (const part of parts) {
      const block = toAnthropicContentBlock(part);
      if (block) blocks.push(block);
    }

    if (blocks.length === 0) continue;

    // Collapse single text block to plain string for efficiency
    const content: string | AnthropicContentBlock[] =
      blocks.length === 1 && blocks[0].type === "text"
        ? (blocks[0] as AnthropicTextBlock).text
        : blocks;

    result.push({ role, content });
  }

  return { system: systemParts.join("\n"), messages: result };
}

function resolveJsonSchemaFormat(
  params: Pick<InvokeParams, "responseFormat" | "response_format" | "outputSchema" | "output_schema">
): JsonSchema | null {
  const fmt = params.responseFormat || params.response_format;
  if (fmt?.type === "json_schema") return fmt.json_schema;
  const schema = params.outputSchema || params.output_schema;
  if (schema) return schema;
  return null;
}

function mapStopReason(reason: string): string {
  if (reason === "end_turn") return "stop";
  if (reason === "tool_use") return "tool_calls";
  if (reason === "max_tokens") return "length";
  return reason;
}

// ── Main export ────────────────────────────────────────────────────────────

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const maxTokens = params.maxTokens ?? params.max_tokens ?? 8192;
  const { system: systemText, messages: anthropicMessages } = toAnthropicMessages(params.messages);

  // Build Anthropic request body
  const body: Record<string, unknown> = {
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    messages: anthropicMessages,
  };

  // System prompt — merge in json_schema instruction if needed
  const jsonSchema = resolveJsonSchemaFormat(params);
  let fullSystem = systemText;
  if (jsonSchema) {
    const schemaInstruction = `\n\nYou must respond with valid JSON that matches this schema exactly (no extra keys, no markdown fences):\n${JSON.stringify(jsonSchema.schema, null, 2)}`;
    fullSystem = fullSystem ? fullSystem + schemaInstruction : schemaInstruction.trim();
  }
  if (fullSystem) body.system = fullSystem;

  // Tools
  const tools = params.tools;
  if (tools && tools.length > 0) {
    body.tools = tools.map(t => ({
      name: t.function.name,
      description: t.function.description ?? "",
      input_schema: t.function.parameters ?? { type: "object", properties: {} },
    }));

    // tool_choice
    const tc = params.toolChoice ?? params.tool_choice;
    if (tc && tc !== "auto") {
      if (tc === "none") {
        body.tool_choice = { type: "auto" }; // Anthropic has no "none" — just don't call tools
      } else if (tc === "required") {
        body.tool_choice = { type: "any" };
      } else if ("name" in tc) {
        body.tool_choice = { type: "tool", name: tc.name };
      } else if ("type" in tc && tc.type === "function") {
        body.tool_choice = { type: "tool", name: tc.function.name };
      }
    }
  }

  // Native Anthropic tools (e.g. web_search_20250305) — passed through as-is, takes precedence over tools
  const nativeTools = params.nativeTools;
  if (nativeTools && nativeTools.length > 0) {
    body.tools = nativeTools;
  }

  const hasWebSearch = nativeTools?.some((t: any) => t.type === "web_search_20250305");

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ENV.anthropicApiKey,
      "anthropic-version": "2023-06-01",
      ...(hasWebSearch ? { "anthropic-beta": "web-search-2025-03-05" } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`);
  }

  const anthropicResult = (await response.json()) as AnthropicResponse;

  // Map Anthropic response → InvokeResult (OpenAI-compatible shape callers expect)
  let textContent = "";
  const toolCalls: ToolCall[] = [];

  for (const block of anthropicResult.content) {
    if (block.type === "text") {
      textContent += block.text;
    } else if (block.type === "tool_use") {
      toolCalls.push({
        id: block.id,
        type: "function",
        function: {
          name: block.name,
          arguments: JSON.stringify(block.input),
        },
      });
    }
  }

  const messageContent = textContent || "";

  return {
    id: anthropicResult.id,
    created: Math.floor(Date.now() / 1000),
    model: anthropicResult.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: messageContent,
          ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
        },
        finish_reason: mapStopReason(anthropicResult.stop_reason),
      },
    ],
    usage: {
      prompt_tokens: anthropicResult.usage.input_tokens,
      completion_tokens: anthropicResult.usage.output_tokens,
      total_tokens: anthropicResult.usage.input_tokens + anthropicResult.usage.output_tokens,
    },
  };
}
