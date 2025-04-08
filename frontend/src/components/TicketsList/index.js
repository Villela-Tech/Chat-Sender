import React, { useState, useEffect, useReducer, useContext } from "react";

import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import Paper from "@material-ui/core/Paper";

import TicketListItem from "../TicketListItem";
import TicketsListSkeleton from "../TicketsListSkeleton";

import useTickets from "../../hooks/useTickets";
import { i18n } from "../../translate/i18n";
import { ListSubheader } from "@material-ui/core";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";

const useStyles = makeStyles((theme) => ({
  ticketsListWrapper: {
    position: "relative",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflow: "hidden",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },

  ticketsList: {
    flex: 1,
    overflowY: "scroll",
    ...theme.scrollbarStyles,
    borderTop: "2px solid rgba(0, 0, 0, 0.12)",
  },

  ticketsListHeader: {
    color: "rgb(67, 83, 105)",
    zIndex: 2,
    backgroundColor: "white",
    borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  ticketsCount: {
    fontWeight: "normal",
    color: "rgb(104, 121, 146)",
    marginLeft: "8px",
    fontSize: "14px",
  },

  noTicketsText: {
    textAlign: "center",
    color: "rgb(104, 121, 146)",
    fontSize: "14px",
    lineHeight: "1.4",
  },

  noTicketsTitle: {
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0px",
  },

  noTicketsDiv: {
    display: "flex",
    height: "100px",
    margin: 40,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_TICKETS") {
    const newTickets = action.payload;

    newTickets.forEach((ticket) => {
      const ticketIndex = state.findIndex((t) => t.id === ticket.id);
      if (ticketIndex !== -1) {
        state[ticketIndex] = ticket;
        if (ticket.unreadMessages > 0) {
          state.unshift(state.splice(ticketIndex, 1)[0]);
        }
      } else {
        state.push(ticket);
      }
    });

    return [...state];
  }

  if (action.type === "DELETE_TICKET") {
    const ticketId = action.payload;
    return state.filter(ticket => ticket.id !== ticketId);
  }

  if (action.type === "RESET_UNREAD") {
    const ticketId = action.payload;

    const ticketIndex = state.findIndex((t) => t.id === ticketId);
    if (ticketIndex !== -1) {
      state[ticketIndex].unreadMessages = 0;
    }

    return [...state];
  }

  if (action.type === "UPDATE_TICKET") {
    const ticket = action.payload;

    if (ticket.status === "closed") {
      return state.filter(t => t.id !== ticket.id);
    }

    const ticketIndex = state.findIndex((t) => t.id === ticket.id);
    if (ticketIndex !== -1) {
      state[ticketIndex] = ticket;
    } else {
      state.unshift(ticket);
    }

    return [...state];
  }

  if (action.type === "UPDATE_TICKET_UNREAD_MESSAGES") {
    const ticket = action.payload;

    const ticketIndex = state.findIndex((t) => t.id === ticket.id);
    if (ticketIndex !== -1) {
      state[ticketIndex] = ticket;
      state.unshift(state.splice(ticketIndex, 1)[0]);
    } else {
      state.unshift(ticket);
    }

    return [...state];
  }

  if (action.type === "UPDATE_TICKET_CONTACT") {
    const contact = action.payload;
    const ticketIndex = state.findIndex((t) => t.contactId === contact.id);
    if (ticketIndex !== -1) {
      state[ticketIndex].contact = contact;
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }

  return state;
};

const TicketsList = ({
  status,
  searchParam,
  tags,
  showAll,
  selectedQueueIds,
}) => {
  const classes = useStyles();
  const [pageNumber, setPageNumber] = useState(1);
  const [ticketsList, dispatch] = useReducer(reducer, []);
  const { user } = useContext(AuthContext);

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [status, searchParam, dispatch, showAll, selectedQueueIds]);

  const { tickets, hasMore, loading } = useTickets({
    pageNumber,
    searchParam,
    tags: JSON.stringify(tags),
    status,
    showAll,
    queueIds: JSON.stringify(selectedQueueIds),
  });

  useEffect(() => {
    if (!status && !searchParam) return;
    dispatch({
      type: "LOAD_TICKETS",
      payload: tickets,
    });
  }, [tickets, status, searchParam]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.getSocket(companyId);

    const shouldUpdateTicket = (ticket) => {
      if (!ticket) {
        console.warn("Ticket inválido recebido no shouldUpdateTicket");
        return false;
      }

      if (ticket.status === "closed") {
        return true;
      }

      if (user.profile !== "admin") {
        const userQueueIds = user.queues.map(q => q.id);
        if (!userQueueIds.includes(ticket.queueId)) {
          return false;
        }
      }

      if (ticket.queue?.id !== selectedQueueIds[0] && selectedQueueIds.length === 1) {
        return false;
      }

      if (ticket.user?.id !== user?.id && selectedQueueIds.length > 1) {
        return false;
      }

      if (selectedQueueIds.length > 0 && !ticket.tags?.some(tag => selectedQueueIds.includes(tag.id))) {
        return false;
      }

      return true;
    };

    const handleUpdateTicket = (data) => {
      dispatch({
        type: "UPDATE_TICKET",
        payload: data,
      });
    };

    const handleDeleteTicket = (data) => {
      dispatch({
        type: "DELETE_TICKET",
        payload: data.id,
      });
    };

    socket.on("connect", () => {
      console.debug("Socket conectado, status:", status);
      if (status) {
        socket.emit("joinTickets", status);
      } else {
        socket.emit("joinNotification");
      }
    });

    socket.on(`company-${companyId}-ticket`, (data) => {
      try {
        console.debug("Evento de ticket recebido:", data);

        if (!data) {
          console.warn("Dados do evento inválidos");
          return;
        }

        if (data.action === "updateUnread") {
          dispatch({
            type: "RESET_UNREAD",
            payload: data.ticketId,
          });
          return;
        }

        if (data.action === "update" && data.ticket?.status === "closed") {
          console.debug("Removendo ticket fechado:", data.ticket.id);
          dispatch({
            type: "DELETE_TICKET",
            payload: data.ticket.id
          });
          return;
        }

        if (data.action === "delete") {
          console.debug("Removendo ticket por delete:", data.ticketId);
          dispatch({
            type: "DELETE_TICKET",
            payload: data.ticketId
          });
          return;
        }

        if (data.action === "update" && data.ticket) {
          const ticket = data.ticket;
          
          if (!ticket) {
            console.warn("Ticket inválido no evento de atualização");
            return;
          }

          if (shouldUpdateTicket(ticket)) {
            const validTicket = {
              ...ticket,
              queue: ticket?.queue || null,
              queueId: ticket?.queueId || null
            };

            console.debug("Atualizando ticket:", validTicket);
            handleUpdateTicket(validTicket);
          } else {
            console.debug("Ticket não atende aos critérios de atualização");
          }
        }
      } catch (err) {
        console.error("Erro ao processar evento de ticket:", err);
      }
    });

    socket.on(`company-${companyId}-appMessage`, (data) => {
      try {
        console.debug("Evento de mensagem recebido:", data);
        
        if (!data || !data.ticket) {
          console.warn("Dados da mensagem inválidos");
          return;
        }

        if (data.action === "create" && shouldUpdateTicket(data.ticket)) {
          const validTicket = {
            ...data.ticket,
            queue: data.ticket?.queue || null,
            queueId: data.ticket?.queueId || null
          };

          console.debug("Atualizando ticket com nova mensagem:", validTicket);

          handleUpdateTicket(validTicket);
        }
      } catch (err) {
        console.error("Erro ao processar mensagem:", err);
      }
    });

    return () => {
      console.debug("Desconectando listeners de socket");
      socket.off(`company-${companyId}-ticket`);
      socket.off(`company-${companyId}-appMessage`);
    };
  }, [status, showAll, user, selectedQueueIds, socketManager]);

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;

    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  return (
    <div className={classes.ticketsListWrapper}>
      <Paper
        square
        name="closed"
        elevation={0}
        className={classes.ticketsList}
        onScroll={handleScroll}
      >
        <List style={{ paddingTop: 0 }}>
          {status === "open" && (
            <ListSubheader className={classes.ticketsListHeader}>
              <div>
                {i18n.t("ticketsList.assignedHeader")}
                <span className={classes.ticketsCount}>
                  {ticketsList.length}
                </span>
              </div>
            </ListSubheader>
          )}
          {status === "pending" && (
            <ListSubheader className={classes.ticketsListHeader}>
              <div>
                {i18n.t("ticketsList.pendingHeader")}
                <span className={classes.ticketsCount}>
                  {ticketsList.length}
                </span>
              </div>
            </ListSubheader>
          )}
          {ticketsList.length === 0 && !loading ? (
            <div className={classes.noTicketsDiv}>
              <span className={classes.noTicketsTitle}>
                {i18n.t("ticketsList.noTicketsTitle")}
              </span>
              <p className={classes.noTicketsText}>
                {i18n.t("ticketsList.noTicketsMessage")}
              </p>
            </div>
          ) : (
            <>
              {ticketsList.map((ticket) => (
                <TicketListItem ticket={ticket} key={ticket.id} />
              ))}
            </>
          )}
          {loading && <TicketsListSkeleton />}
        </List>
      </Paper>
    </div>
  );
};

export default TicketsList;
