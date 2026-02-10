import { ApiProperty } from "@nestjs/swagger";

export class McpJsonRpcRequestDto {
  @ApiProperty({ example: "2.0" })
  jsonrpc?: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description: "Request id. Omit id for notifications.",
    anyOf: [{ type: "string" }, { type: "number" }, { type: "null" }],
    example: 1
  })
  id?: string | number | null;

  @ApiProperty({ example: "tools/list" })
  method?: string;

  @ApiProperty({
    required: false,
    description: "JSON-RPC params object (method-specific).",
    type: "object",
    additionalProperties: true,
    example: {}
  })
  params?: any;
}

export class McpJsonRpcResponseDto {
  @ApiProperty({ example: "2.0" })
  jsonrpc!: "2.0";

  @ApiProperty({
    nullable: true,
    anyOf: [{ type: "string" }, { type: "number" }, { type: "null" }],
    example: 1
  })
  id!: string | number | null;

  @ApiProperty({
    required: false,
    description: "JSON-RPC result payload (method-specific).",
    type: "object",
    additionalProperties: true
  })
  result?: any;

  @ApiProperty({
    required: false,
    description: "JSON-RPC error payload.",
    type: "object",
    additionalProperties: true
  })
  error?: { code: number; message: string; data?: any };
}

