import React, { useState, useEffect, useReducer, useContext } from "react";

import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import Paper from "@material-ui/core/Paper";

import TicketListItem from "../TicketListItemCustom";
import TicketsListSkeleton from "../TicketsListSkeleton";

import useTickets from "../../hooks/useTickets";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import useSettings from '../../hooks/useSettings';

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
    maxHeight: "100%",
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

    return newTickets;
  }
  if (action.type === "UPDATE_TICKETS") {
    const updatedTicket = action.payload;
    const ticketIndex = state.findIndex(t => t.id === updatedTicket.id);

    if (ticketIndex !== -1) {
      state[ticketIndex] = updatedTicket;
    }
  }
  if (action.type === "FILTER_TICKETS") {
    const ticketToFilter = action.payload;
    const ticketIndex = state.findIndex(t => t.id === ticketToFilter.id);

    if (ticketIndex !== -1) {
      state.splice(ticketIndex, 1);
    }
  }
  if (action.type === "SET_TICKETS") {
    return action.payload;
  }
  return state;
};

const TicketsListCustom = (props) => {
  const classes = useStyles();
  const { tickets = [], loading = false, hasMore = false, searchParam = "", showAll = false, selectedQueueIds = [], selectedTags = [], selectedUsers = [] } = props;
  const { user } = useContext(AuthContext);
  const { socketManager } = useContext(SocketContext);
  const [ticketsState, dispatch] = useReducer(reducer, []);
  const [pageNumber, setPageNumber] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreTickets, setHasMoreTickets] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(true);

  useEffect(() => {
    if (tickets) {
      dispatch({ type: "SET_TICKETS", payload: tickets });
      setLoadingTickets(false);
    }
  }, [tickets]);

  useEffect(() => {
    if (hasMore !== undefined) {
      setHasMoreTickets(hasMore);
    }
  }, [hasMore]);

  useEffect(() => {
    if (loading !== undefined) {
      setLoadingTickets(loading);
    }
  }, [loading]);

  const shouldUpdateTicket = (ticket) =>
    (!ticket?.userId || ticket.userId === user?.id || showAll) &&
    (!selectedQueueIds?.length || selectedQueueIds.includes(ticket?.queueId)) &&
    (!selectedTags?.length || ticket?.tags?.some(tag => selectedTags.includes(tag.id))) &&
    (!selectedUsers?.length || selectedUsers.includes(ticket?.userId));

  const notBelongsToUserQueues = (ticket) =>
    ticket?.queueId && selectedQueueIds?.indexOf(ticket.queueId) === -1;

  const filteredTickets = ticketsState.filter(ticket => shouldUpdateTicket(ticket));

  if (loadingTickets) {
    return <TicketsListSkeleton />;
  }

  return (
    <Paper className={classes.ticketsListWrapper} square>
      <List className={classes.ticketsList}>
        {filteredTickets.length > 0 ? (
          filteredTickets.map(ticket => (
            <TicketListItem
              key={ticket.id}
              ticket={ticket}
              ticketId={ticket.id}
            />
          ))
        ) : (
          <div className={classes.noTickets}>
            {i18n.t("ticketsList.noTickets")}
          </div>
        )}
      </List>
    </Paper>
  );
};

export default TicketsListCustom;
