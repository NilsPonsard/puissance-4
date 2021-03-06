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
const fs = __importStar(require("fs"));
const socketio = __importStar(require("socket.io"));
const columns = 6;
const rows = 7;
let app = express.default();
let server = http.createServer(app);
let io = socketio.default(server);
/*

test vers le bas
test diagonales (2)
test horizontal


*/
app.use(express.static("public"));
class Player {
    constructor(socket, name) {
        this.points = 0;
        this.matchID = -1;
        this.inQueue = false;
        this.socket = socket;
        this.name = name;
    }
}
class Match {
    constructor(player1, player2, id) {
        this.turn = 0;
        if (player1.matchID != -1) {
            parties[player1.matchID].end();
        }
        if (player2.matchID != -1) {
            parties[player2.matchID].end();
        }
        player1.matchID = id;
        player1.inQueue = false;
        player2.matchID = id;
        player2.inQueue = false;
        this.player1 = player1;
        this.player2 = player2;
        this.playing = true;
        this.player1.socket.emit("opponent name", { name: player2.name, number: 2 });
        this.player2.socket.emit("opponent name", { name: player1.name, number: 1 });
        this.grid = [];
        for (let i = 0; i < 7; ++i) {
            let line = [];
            for (let j = 0; j < 6; ++j) {
                line.push(0);
            }
            this.grid.push(line);
        }
        this.player1.socket.emit("place", this.grid);
        this.player2.socket.emit("place", this.grid);
    }
    launch() {
        this.player1.socket.on("place", (pos) => {
            //console.log(pos)
            if (this.playing) {
                if (this.turn % 2 === 0 && pos >= 0 && pos < rows) {
                    if (this.grid[pos][0] != 0) {
                        this.player1.socket.emit("errorMessage", "col is full");
                        this.player1.socket.emit("your turn");
                    }
                    else {
                        let i = 0;
                        for (; i < 7 && this.grid[pos][i] === 0; ++i) {
                        }
                        --i;
                        this.grid[pos][i] = 1;
                        this.turn += 1;
                        this.player2.socket.emit("place", this.grid);
                        this.player1.socket.emit("place", this.grid);
                        this.player2.socket.emit("your turn");
                        this.checkWin([pos, i]);
                    }
                }
            }
        });
        this.player2.socket.on("place", (pos) => {
            //console.log(pos)
            if (this.playing) {
                if (this.turn % 2 === 1 && pos >= 0 && pos < rows) {
                    if (this.grid[pos][0] != 0) {
                        this.player2.socket.emit("errorMessage", "col is full");
                        this.player2.socket.emit("your turn");
                    }
                    else {
                        let i = 0;
                        for (; i < 7 && this.grid[pos][i] === 0; ++i) {
                        }
                        --i;
                        this.grid[pos][i] = 2;
                        this.turn += 1;
                        this.player2.socket.emit("place", this.grid);
                        this.player1.socket.emit("place", this.grid);
                        this.player1.socket.emit("your turn");
                        this.checkWin([pos, i]);
                    }
                }
            }
        });
        this.player1.socket.emit("your turn");
    }
    end() {
        this.playing = false;
        try {
            this.player1.matchID = -1;
            this.player2.matchID = -1;
            this.player1.socket.emit("match ended");
            this.player2.socket.emit("match ended");
        }
        catch (e) {
            console.log("match delete may have failed");
        }
    }
    checkWin(pos) {
        let player = this.grid[pos[0]][pos[1]];
        let win = false;
        let i = pos[0];
        let j = pos[1];
        if (columns - j >= 3) { //si plus de 3 pièces sont empilées
            let c = 0;
            for (; j < columns && this.grid[i][j] === player && c <= 4; ++j) {
                ++c;
            }
            if (c >= 4) {
                win = true;
            }
        }
        i = pos[0];
        j = pos[1];
        if (!win) {
            // aller vers la droite
            console.log("--horizontal");
            console.log("vers la droite");
            while (i < columns) {
                if (this.grid[i][j] != player) {
                    --i;
                    break;
                }
                ++i;
            }
            console.log(`x : ${i}`);
            console.log("vers la gauche");
            let c = 0;
            for (; i >= 0 && c < 4 && this.grid[i][j] === player; --i) {
                ++c;
                console.log(c);
            }
            if (c >= 4) {
                win = true;
            }
        }
        i = pos[0];
        j = pos[1];
        if (!win) {
            console.log("--diagonale 1");
            console.log("--haut droite");
            // en haut à droite 
            while (i < columns - 1 && j > 0) {
                ++i;
                --j;
                if (this.grid[i][j] != player) {
                    --i;
                    ++j;
                    break;
                }
            }
            console.log("--bas gauche");
            console.log([i, j]);
            // bas gauche
            let c = 1;
            while (i > 0 && j < rows - 1 && c < 4) {
                --i;
                ++j;
                if (this.grid[i][j] != player) {
                    ++i;
                    --j;
                    break;
                }
                ++c;
                console.log(c);
                console.log([i, j]);
            }
            if (c >= 4) {
                win = true;
            }
        }
        i = pos[0];
        j = pos[1];
        if (!win) {
            console.log("--diagonale 2");
            console.log([i, j]);
            console.log("--haut gauche");
            while (i > 0 && j > 0) {
                --i;
                --j;
                if (this.grid[i][j] != player) {
                    ++i;
                    ++j;
                    break;
                }
            }
            console.log("--bas droite");
            console.log([i, j]);
            let c = 1;
            while (i < columns && j < rows && c < 4) {
                ++i;
                ++j;
                if (this.grid[i][j] != player) {
                    --i;
                    --j;
                    break;
                }
                ++c;
                console.log(c);
                console.log([i, j]);
            }
            if (c >= 4) {
                win = true;
            }
        }
        console.log(`win : ${win}`);
        if (win) {
            this.playing = false;
            this.player1.matchID = -1;
            this.player2.matchID = -1;
            if (player == 1) {
                this.player1.socket.emit("winner", true);
                this.player2.socket.emit("winner", false);
            }
            if (player == 2) {
                this.player1.socket.emit("winner", false);
                this.player2.socket.emit("winner", true);
            }
        }
    }
}
let players = new Map();
let privateGamesLobby = new Map();
let searchingPlayers = [];
let parties = [];
function privateGameIdGen() {
    let length = 5;
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let charsLength = chars.length;
    let out = "";
    for (let i = 0; i < length; ++i) {
        out += chars.charAt(Math.floor(Math.random() * charsLength));
    }
    return out;
}
let connectionCount = 0;
io.on("connection", (socket) => {
    connectionCount += 1;
    socket.on("new player", (name) => {
        fs.appendFile("players.log", name + "\n", () => { console.log("name " + name + " written"); });
        let p = new Player(socket, name);
        players.set(socket.id, p);
    });
    socket.on("create private game", () => {
        let gameID = privateGameIdGen();
        while (privateGamesLobby.has(gameID)) {
            gameID = privateGameIdGen();
        }
        privateGamesLobby.set(gameID, players.get(socket.id));
        socket.emit("private game created", gameID);
    });
    socket.on("join private game", (gameID) => {
        if (players.get(socket.id)) {
            if (privateGamesLobby.get(gameID)) {
                let partie = new Match(privateGamesLobby.get(gameID), players.get(socket.id), parties.length);
                partie.launch();
                parties.push(partie);
            }
            else {
                socket.emit("errorMessage", "partie non trouvée");
            }
        }
        else {
            socket.emit("errorMessage", "player is undefined");
        }
    });
    socket.on("search match", () => {
        if (players.get(socket.id) && !players.get(socket.id).inQueue) {
            if (searchingPlayers.length === 0) {
                searchingPlayers.push(players.get(socket.id));
                socket.emit("queued");
                players.get(socket.id).inQueue = true;
            }
            else {
                let partie = new Match(searchingPlayers.shift(), players.get(socket.id), parties.length);
                partie.launch();
                parties.push(partie);
            }
        }
        else {
            socket.emit("errorMessage", "player is undefined");
        }
    });
    socket.on("disconnect", () => {
        connectionCount -= 1;
        if (players.get(socket.id)) {
            // kick from queue at least
            players.get(socket.id).inQueue = false;
            let index = searchingPlayers.lastIndexOf(players.get(socket.id));
            if (index != -1) {
                searchingPlayers.splice(index, 1);
            }
        } /*
        console.log("disconnected", connectionCount)
        socket.broadcast.emit("connectionCount", connectionCount)

        try {

            if (players.get(socket.id) != null) {

                
                for (index = 0; index < parties.length && (parties[index].player1.socket.id != socket.id && parties[index].player2.socket.id != socket.id); ++index) {
                }
                parties[index].end()
                players.delete(socket.id)
            }
        } catch (e) {
            console.log(e)
        }
        */
    });
    socket.broadcast.emit("connectionCount", connectionCount);
    console.log("a socket is connected");
    socket.emit("connected", connectionCount);
});
server.listen(8080, () => {
    console.log("listening on 8080");
});
