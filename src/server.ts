import * as http from "http"
import * as express from "express"

import * as socketio from "socket.io"

const columns = 6
const rows = 7


let app = express.default()

let server = http.createServer(app)

let io = socketio.default(server)
/*

test vers le bas
test diagonales (2)
test horizontal


*/


app.use(express.static("public"))


class Player {
    socket: socketio.Socket
    name: string
    points: number = 0
    constructor(socket: socketio.Socket, name: string) {
        this.socket = socket
        this.name = name
    }
}



class Match {
    player1: Player
    grid: Array<Array<number>>
    player2: Player

    turn: number = 0

    constructor(player1: Player, player2: Player) {
        this.player1 = player1
        this.player2 = player2

        this.player1.socket.emit("opponent name", { name: player2.name, number: 2 })
        this.player2.socket.emit("opponent name", { name: player1.name, number: 1 })

        this.grid = []
        for (let i = 0; i < 7; ++i) {
            let line = []
            for (let j = 0; j < 6; ++j) { line.push(0) }
            this.grid.push(line)
        }
        this.player1.socket.emit("place", this.grid)
        this.player2.socket.emit("place", this.grid)

    }
    launch() {

        this.player1.socket.on("place", (pos: number) => {
            //console.log(pos)

            if (this.turn % 2 === 0 && pos >= 0 && pos <= 7) {
                if (this.grid[pos][0] != 0) {
                    this.player1.socket.emit("errorMessage", "col is full")
                    this.player1.socket.emit("your turn")

                } else {
                    let i = 0
                    for (; i < 7 && this.grid[pos][i] === 0; ++i) {

                    }
                    --i
                    this.grid[pos][i] = 1

                    this.turn += 1
                    this.player2.socket.emit("place", this.grid)
                    this.player1.socket.emit("place", this.grid)

                    this.player2.socket.emit("your turn")
                    this.checkWin([pos, i])
                }

            }
        })
        this.player2.socket.on("place", (pos: number) => {
            //console.log(pos)

            if (this.turn % 2 === 1 && pos >= 0 && pos <= 7) {
                if (this.grid[pos][0] != 0) {
                    this.player2.socket.emit("errorMessage", "col is full")
                    this.player2.socket.emit("your turn")

                } else {
                    let i = 0
                    for (; i < 7 && this.grid[pos][i] === 0; ++i) {

                    }
                    --i
                    this.grid[pos][i] = 2

                    this.turn += 1
                    this.player2.socket.emit("place", this.grid)
                    this.player1.socket.emit("place", this.grid)

                    this.player1.socket.emit("your turn")
                    this.checkWin([pos, i])

                }

            }
        })
        this.player1.socket.emit("your turn")


    }
    end() {
        this.player1.socket.emit("match ended")
        this.player2.socket.emit("match ended")
        delete (this.player2)
        delete (this.player2)
    }
    checkWin(pos: Array<number>) {
        let player = this.grid[pos[0]][pos[1]]

        let win = false
        let i = pos[0]
        let j = pos[1]
        if (columns - j >= 3) {//si plus de 3 pièces sont empilées
            let c = 0
            for (; j < columns && this.grid[i][j] === player && c <= 4; ++j) {
                ++c
            }
            if (c >= 4) {
                win = true
            }
        }
        i = pos[0]
        j = pos[1]
        if (!win) {
            // aller vers la droite
            console.log("--horizontal")

            console.log("vers la droite")
            let c = 0
            while (i < columns && c < 4) {
                if (this.grid[i][j] != player) {
                    --i
                    break
                }
                ++i
                ++c

                console.log(c)
            }
            console.log(`x : ${i}`)
            if (c >= 4) {
                win = true
            }
            else {
                console.log("vers la gauche")
                c = 0
                for (; i >= 0 && c < 4 && this.grid[i][j] === player; --i) {
                    ++c
                    console.log(c)

                }
                if (c >= 4) {
                    win = true
                }
            }
        }
        i = pos[0]
        j = pos[1]
        if (!win) {
            console.log("--diagonale 1")
            console.log("--haut droite")

            // en haut à droite 
            let c = 1
            while (i < columns - 1 && j > 0 && c < 4) {
                ++i
                --j
                if (this.grid[i][j] != player) {
                    --i
                    ++j
                    break
                }



                ++c
                console.log(c)
            }

            if (c >= 4) {
                win = true
            }
            else {
                console.log("--bas gauche")
                console.log([i, j])
                // bas gauche
                c = 1
                while (i > 0 && j < rows - 1 && c < 4) {
                    --i
                    ++j
                    if (this.grid[i][j] != player) {
                        ++i
                        --j
                        break
                    }

                    ++c
                    console.log(c)

                }
                if (c >= 4) {
                    win = true
                }
            }
        }
        i = pos[0]
        j = pos[1]
        if (!win) {
            console.log("--diagonale 2")
            console.log([i, j])

            console.log("--haut gauche")


            let c = 1
            while (i > 0 && j > 0 && c < 4) {
                --i
                --j
                if (this.grid[i][j] != player) {
                    ++i
                    ++j
                    break
                }
                ++c
                console.log(c)
            }

            if (c >= 4) {
                win = true
            }
            else {
                console.log("--bas droite")
                console.log([i, j])
                c = 1
                while (i < columns && j < rows && c < 4) {

                    if (this.grid[i][j] != player) {
                        --i
                        --j
                        break
                    }
                    ++i
                    ++j
                    ++c
                    console.log(c)

                }
                if (c >= 4) {
                    win = true
                }
            }
        }


        console.log(`win : ${win}`)
        if (win) {
            if (player == 1) {
                this.player1.socket.emit("winner", true)
                this.player2.socket.emit("winner", false)
            }

            if (player == 2) {
                this.player1.socket.emit("winner", false)
                this.player2.socket.emit("winner", true)
            }
        }
    }
}



let players: Map<string, Player> = new Map()

let searchingPlayers: Array<Player> = []
let parties: Array<Match> = []


io.on("connection", (socket) => {
    console.log("a socket is connected")

    socket.on("new player", (name) => {
        let p = new Player(socket, name)
        players.set(socket.id, p)
    })


    socket.on("search match", () => {
        if (players.get(socket.id)) {
            if (searchingPlayers.length === 0) {
                searchingPlayers.push(<Player>players.get(socket.id))
                socket.emit("queued")
            }
            else {
                let partie = new Match(<Player>searchingPlayers.shift(), <Player>players.get(socket.id))
                partie.launch()
                parties.push(partie)
            }
        }
        else {
            socket.emit("errorMessage", "player is undefined")
        }
    })
    socket.on("disconnect", () => {
        try {

            if (players.get(socket.id) != null) {

                let index = searchingPlayers.lastIndexOf(<Player>players.get(socket.id))
                if (index != -1) {
                    searchingPlayers.splice(index, 1)
                }
                for (index = 0; index < parties.length && (parties[index].player1.socket.id != socket.id && parties[index].player2.socket.id != socket.id); ++index) {
                }
                parties[index].end()
                players.delete(socket.id)
            }
        } catch (e) {
            console.log(e)
        }
    })
    socket.emit("connected")

})




server.listen(8080, () => {
    console.log("listening on 8080")
})



