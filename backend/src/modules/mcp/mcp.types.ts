export type McpJsonRpcId = string | number | null;

export type McpJsonRpcRequest = {
  jsonrpc?: string;
  id?: McpJsonRpcId;
  method?: string;
  params?: any;
};

export type McpJsonRpcResponse = {
  jsonrpc: "2.0";
  id: McpJsonRpcId;
  result?: any;
  error?: { code: number; message: string; data?: any };
};

