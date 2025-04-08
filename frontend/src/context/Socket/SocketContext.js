/*

   NÃO REMOVER

   Fornecido por Claudemir Todo Bom
   Licenciado para Raphael Batista / Equipechat
   
   Licença vitalícia e exclusiva. Não pode ser sublicenciado a terceiros

 */

import { createContext } from "react";
import openSocket from "socket.io-client";
import { isExpired } from "react-jwt";

class ManagedSocket {
  constructor(socketManager) {
    this.socketManager = socketManager;
    this.rawSocket = socketManager.currentSocket;
    this.callbacks = [];
    this.joins = [];

    this.rawSocket.on("connect", () => {
      if (this.rawSocket.io.opts.query?.r && !this.rawSocket.recovered) {
        const refreshJoinsOnReady = () => {
          for (const j of this.joins) {
            console.debug("refreshing join", j);
            this.rawSocket.emit(`join${j.event}`, ...j.params);
          }
          this.rawSocket.off("ready", refreshJoinsOnReady);
        };
        for (const j of this.callbacks) {
          this.rawSocket.off(j.event, j.callback);
          this.rawSocket.on(j.event, j.callback);
        }
        
        this.rawSocket.on("ready", refreshJoinsOnReady);
      }
    });
  }
  
  on(event, callback) {
    if (event === "ready" || event === "connect") {
      return this.socketManager.onReady(callback);
    }
    this.callbacks.push({event, callback});
    return this.rawSocket.on(event, callback);
  }
  
  off(event, callback) {
    const i = this.callbacks.findIndex((c) => c.event === event && c.callback === callback);
    if (i !== -1) {
      this.callbacks.splice(i, 1);
    }
    return this.rawSocket.off(event, callback);
  }
  
  emit(event, ...params) {
    if (event.startsWith("join")) {
      const existingJoinIndex = this.joins.findIndex(j => j.event === event.substring(4));
      if (existingJoinIndex === -1) {
        this.joins.push({ event: event.substring(4), params });
        console.log("Joining", { event: event.substring(4), params});
      }
    }
    return this.rawSocket.emit(event, ...params);
  }
  
  disconnect() {
    // Não desconecta o socket real, apenas limpa os callbacks locais
    this.callbacks = [];
    this.joins = [];
  }
}

class DummySocket {
  on(..._) {}
  off(..._) {}
  emit(..._) {}
  disconnect() {}
}

const socketManager = {
  currentCompanyId: -1,
  currentUserId: -1,
  currentSocket: null,
  socketReady: false,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,

  getSocket: function(companyId) {
    let userId = null;
    if (localStorage.getItem("userId")) {
      userId = localStorage.getItem("userId");
    }

    if (!companyId && !this.currentSocket) {
      return new DummySocket();
    }

    if (companyId && typeof companyId !== "string") {
      companyId = `${companyId}`;
    }

    if (companyId !== this.currentCompanyId || userId !== this.currentUserId) {
      if (this.currentSocket) {
        console.warn("closing old socket - company or user changed");
        this.currentSocket.removeAllListeners();
        this.currentSocket.disconnect();
        this.currentSocket = null;
        this.currentCompanyId = null;
        this.currentUserId = null;
        this.reconnectAttempts = 0;
      }

      let token = JSON.parse(localStorage.getItem("token"));
      if (!token) {
        return new DummySocket();
      }
      
      if (isExpired(token)) {
        console.warn("Expired token, waiting for refresh");
        setTimeout(() => {
          const currentToken = JSON.parse(localStorage.getItem("token"));
          if (isExpired(currentToken)) {
            localStorage.removeItem("token");
            localStorage.removeItem("companyId");
          }
          window.location.reload();
        }, 1000);
        return new DummySocket();
      }

      this.currentCompanyId = companyId;
      this.currentUserId = userId;
      
      this.currentSocket = openSocket(process.env.REACT_APP_BACKEND_URL, {
        transports: ["websocket"],
        pingTimeout: 60000,
        pingInterval: 25000,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        query: { token },
      });

      this.currentSocket.io.on("reconnect_attempt", () => {
        this.reconnectAttempts++;
        this.currentSocket.io.opts.query.r = 1;
        token = JSON.parse(localStorage.getItem("token"));
        if (isExpired(token)) {
          console.warn("Token expired during reconnect - refreshing");
          window.location.reload();
        } else {
          console.warn("Using new token for reconnection attempt", this.reconnectAttempts);
          this.currentSocket.io.opts.query.token = token;
        }
      });
      
      this.currentSocket.on("disconnect", (reason) => {
        console.warn(`socket disconnected because: ${reason}`);
        if (reason === "io server disconnect") {
          console.warn("Server disconnected socket - attempting reconnect");
          token = JSON.parse(localStorage.getItem("token"));
          
          if (isExpired(token)) {
            console.warn("Token expired - refreshing page");
            window.location.reload();
            return;
          }
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            console.warn("Reconnecting with refreshed token");
            this.currentSocket.io.opts.query.token = token;
            this.currentSocket.io.opts.query.r = 1;
            this.currentSocket.connect();
          } else {
            console.warn("Max reconnection attempts reached - reloading page");
            window.location.reload();
          }
        }
      });
      
      this.currentSocket.on("connect", () => {
        console.warn("Socket connected successfully");
        this.reconnectAttempts = 0;
      });
      
      this.currentSocket.onAny((event, ...args) => {
        console.debug("Socket Event: ", { event, args });
      });
      
      this.onReady(() => {
        this.socketReady = true;
      });
    }
    
    return new ManagedSocket(this);
  },
  
  onReady: function(callbackReady) {
    if (this.socketReady) {
      callbackReady();
      return;
    }
    
    if (!this.currentSocket) {
      return;
    }
    
    this.currentSocket.once("ready", () => {
      callbackReady();
    });
  },
  
  onConnect: function(callbackReady) { 
    this.onReady(callbackReady);
  }
};

const SocketContext = createContext();

export { SocketContext, socketManager };
