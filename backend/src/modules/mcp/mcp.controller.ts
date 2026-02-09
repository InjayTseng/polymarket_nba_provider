import { Body, Controller, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { McpService } from "./mcp.service";
import type { McpJsonRpcRequest, McpJsonRpcResponse } from "./mcp.types";

function ok(id: any, result: any): McpJsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function err(id: any, code: number, message: string, data?: any): McpJsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}

@Controller("mcp")
@ApiTags("MCP")
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Post()
  @ApiOperation({ summary: "MCP JSON-RPC endpoint" })
  async handle(@Body() body: McpJsonRpcRequest, @Res() res: Response) {
    const id = body?.id ?? null;
    const method = String(body?.method || "");

    if (body?.jsonrpc !== "2.0") {
      res.status(200).json(err(id, -32600, "invalid jsonrpc; expected 2.0"));
      return;
    }
    if (!method) {
      res.status(200).json(err(id, -32600, "missing method"));
      return;
    }

    // Notifications (no id) are allowed; return 204 to be polite.
    const isNotification = body.id === undefined;

    try {
      switch (method) {
        case "initialize": {
          const result = {
            protocolVersion:
              process.env.MCP_PROTOCOL_VERSION || "2024-11-05",
            serverInfo: {
              name: process.env.MCP_SERVER_NAME || "hoobs-mcp",
              version: process.env.MCP_SERVER_VERSION || "1.0.0"
            },
            capabilities: {
              tools: {}
            }
          };
          if (isNotification) {
            res.status(204).end();
            return;
          }
          res.status(200).json(ok(id, result));
          return;
        }
        case "tools/list": {
          const result = { tools: this.mcpService.toolsList() };
          if (isNotification) {
            res.status(204).end();
            return;
          }
          res.status(200).json(ok(id, result));
          return;
        }
        case "tools/call": {
          const name = String(body?.params?.name || "");
          const args = body?.params?.arguments ?? {};
          if (!name) {
            res.status(200).json(err(id, -32602, "params.name is required"));
            return;
          }
          const output = await this.mcpService.toolsCall(name, args);
          const result = {
            content: [{ type: "text", text: JSON.stringify(output) }]
          };
          if (isNotification) {
            res.status(204).end();
            return;
          }
          res.status(200).json(ok(id, result));
          return;
        }
        default: {
          if (isNotification) {
            res.status(204).end();
            return;
          }
          res.status(200).json(err(id, -32601, `method not found: ${method}`));
          return;
        }
      }
    } catch (e: any) {
      const message = e instanceof Error ? e.message : String(e);
      if (isNotification) {
        res.status(204).end();
        return;
      }
      res.status(200).json(err(id, -32000, message));
    }
  }
}
