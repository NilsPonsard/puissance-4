"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("http"));
const express = __importStar(require("express"));
const socketio = __importStar(require("socket.io"));
let app = express.default();
let server = http.createServer(app);
let io = socketio.default(server);
app.use(express.static("public"));
io.on("connection", (socket) => {
    console.log("a socket is connected");
});
server.listen(8080, () => {
    console.log("listening on 8080");
});
