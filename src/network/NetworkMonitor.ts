import EventEmitter from 'eventemitter3';
import http from 'http';

/**
 * Measures network performance between the client and the server
 * Represents both the client and server portions of NetworkMonitor
 */
export default class NetworkMonitor extends EventEmitter {

    constructor(server) {

        // server-side keep game name
        if (server) {
            this.server = server;
            this.gameName = Object.getPrototypeOf(server.gameEngine).constructor.name;
        }
    }

    // client
    registerClient(clientEngine) {
        this.queryIdCounter = 0;
        this.RTTQueries = {};

        this.movingRTTAverage = 0;
        this.movingRTTAverageFrame = [];
        this.movingFPSAverageSize = clientEngine.options.healthCheckRTTSample;
        this.clientEngine = clientEngine;
        clientEngine.socket.on('RTTResponse', this.onReceivedRTTQuery.bind(this));
        setInterval(this.sendRTTQuery.bind(this), clientEngine.options.healthCheckInterval);
    }

    sendRTTQuery() {
        // todo implement cleanup of older timestamp
        this.RTTQueries[this.queryIdCounter] = new Date().getTime();
        this.clientEngine.socket.emit('RTTQuery', this.queryIdCounter);
        this.queryIdCounter++;
    }

    onReceivedRTTQuery(queryId) {
        let RTT = (new Date().getTime()) - this.RTTQueries[queryId];

        this.movingRTTAverageFrame.push(RTT);
        if (this.movingRTTAverageFrame.length > this.movingFPSAverageSize) {
            this.movingRTTAverageFrame.shift();
        }
        this.movingRTTAverage = this.movingRTTAverageFrame.reduce((a, b) => a + b) / this.movingRTTAverageFrame.length;
        this.emit('RTTUpdate', {
            RTT: RTT,
            RTTAverage: this.movingRTTAverage
        });
    }

    // server
    registerPlayerOnServer(socket) {
        socket.on('RTTQuery', this.respondToRTTQuery.bind(this, socket));
        if (this.server && this.server.options.countConnections) {
            http.get(`http://ping.games-eu.lance.gg:2000/${this.gameName}`).on('error', () => { });
        }
    }

    respondToRTTQuery(socket, queryId) {
        socket.emit('RTTResponse', queryId);
    }

}
