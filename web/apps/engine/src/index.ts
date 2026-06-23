import { createServer } from "node:http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { HedgemonyRoom } from "./rooms/HedgemonyRoom";
import { HedgemonyClassicRoom } from "./rooms/HedgemonyClassicRoom";

const PORT = Number(process.env.PORT ?? 2567);

const gameServer = new Server({
  transport: new WebSocketTransport({
    server: createServer(),
  }),
});

gameServer.define("hedgemony", HedgemonyRoom);

// Original RAND Hedgemony — LOCAL STUDY USE ONLY (see ORIGINAL/NOTICE.md). Gated so
// a default/hosted engine never serves classic rooms. Enable locally with ENABLE_CLASSIC=1.
const classicEnabled = process.env.ENABLE_CLASSIC === "1" || process.env.ENABLE_CLASSIC === "true";
if (classicEnabled) {
  gameServer.define("hedgemony-classic", HedgemonyClassicRoom);
}

gameServer.listen(PORT).then(() => {
  console.log(`[engine] Colyseus listening on ws://localhost:${PORT}`);
  console.log(`[engine] room types: "hedgemony"${classicEnabled ? ', "hedgemony-classic"' : ""}`);
});
