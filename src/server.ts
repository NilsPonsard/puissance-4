import * as http from "http"
import * as express from "express"

import * as socketio from "socket.io"
import { match } from "assert"


let app = express.default()

let server = http.createServer(app)

let io = socketio.default(server)



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

        this.player1.socket.emit("opponent name", player2.name)
        this.player2.socket.emit("opponent name", player1.name)


        this.grid = []
        for (let i = 0; i < 7; ++i) {
            let line = []
            for (let j = 0; j < 6; ++j) { line.push(0) }
            this.grid.push(line)
        }

    }
    launch() {

        this.player1.socket.on("place", (pos: number) => {
            console.log(pos)

            if (this.turn % 2 === 0 && pos >= 0 && pos <= 7) {
                if (this.grid[pos][0] != 0) {
                    this.player1.socket.emit("errorMessage", "col is full")
                    this.player1.socket.emit("your turn")

                } else {
                    let i = 0
                    for (; i < 7 && this.grid[pos][i] === 0; ++i) {

                    }
                    this.grid[pos][i - 1] = 1


                    this.turn += 1
                    this.player2.socket.emit("place", this.grid)
                    this.player1.socket.emit("place", this.grid)

                    this.player2.socket.emit("your turn")
                }

            }
        })
        this.player2.socket.on("place", (pos: number) => {
            console.log(pos)

            if (this.turn % 2 === 1 && pos >= 0 && pos <= 7) {
                if (this.grid[pos][0] != 0) {
                    this.player2.socket.emit("errorMessage", "col is full")
                    this.player2.socket.emit("your turn")

                } else {
                    let i = 0
                    for (; i < 7 && this.grid[pos][i] === 0; ++i) {

                    }

                    this.grid[pos][i - 1] = 2


                    this.turn += 1
                    this.player2.socket.emit("place", this.grid)
                    this.player1.socket.emit("place", this.grid)
                    this.player1.socket.emit("your turn")

                }

            }
        })
        this.player1.socket.emit("your turn")

    }
    end() {
        this.player1.socket.emit("match ended")
        this.player2.socket.emit("match ended")
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



