import React, { useContext, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import SearchIcon from "@material-ui/icons/Search";
import InputBase from "@material-ui/core/InputBase";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Badge from "@material-ui/core/Badge";
import MoveToInboxIcon from "@material-ui/icons/MoveToInbox";
import CheckBoxIcon from "@material-ui/icons/CheckBox";

import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";

import NewTicketModal from "../NewTicketModal";
import TicketsListCustom from "../TicketsListCustom";
import TabPanel from "../TabPanel";

import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../Can";
import TicketsQueueSelect from "../TicketsQueueSelect";
import { Button, Snackbar } from "@material-ui/core";
import { TagsFilter } from "../TagsFilter";
import { UsersFilter } from "../UsersFilter";
import api from "../../services/api";
import { TicketsListGroup } from "../TicketsListGroup";
import GroupIcon from "@material-ui/icons/Group";
import { toastSuccess, toastError } from "../../utils/toast";

const useStyles = makeStyles(theme => ({
  ticketsWrapper: {
    position: "relative",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflow: "hidden",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRadius: 0,
  },

  tabsHeader: {
    flex: "none",
    backgroundColor: theme.palette.tabHeaderBackground,
  },

  tabsInternal: {
    flex: "none",
    backgroundColor: theme.palette.tabHeaderBackground
  },

  settingsIcon: {
    alignSelf: "center",
    marginLeft: "auto",
    padding: 8,
  },
  snackbar: {
    display: "flex",
    justifyContent: "space-between",
    backgroundColor: theme.palette.primary.main,
    color: "white",
    borderRadius: 30,
    [theme.breakpoints.down("sm")]: {
      fontSize: "0.8em",
    },
    [theme.breakpoints.up("md")]: {
      fontSize: "1em",
    },
  },

  yesButton: {
    backgroundColor: "#FFF",
    color: "rgba(0, 100, 0, 1)",
    padding: "4px 4px",
    fontSize: "1em",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginRight: theme.spacing(1),
    "&:hover": {
      backgroundColor: "darkGreen",
      color: "#FFF",
    },
    borderRadius: 30,
  },
  noButton: {
    backgroundColor: "#FFF",
    color: "rgba(139, 0, 0, 1)",
    padding: "4px 4px",
    fontSize: "1em",
    fontWeight: "bold",
    textTransform: "uppercase",
    "&:hover": {
      backgroundColor: "darkRed",
      color: "#FFF",
    },
    borderRadius: 30,
  },
  tab: {
    minWidth: 120,
    width: 120,
  },

  internalTab: {
    minWidth: 120,
    width: 120,
    padding: 5
  },

  ticketOptionsBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: theme.palette.optionsBackground,
    padding: theme.spacing(1),
  },

  ticketSearchLine: {
    padding: theme.spacing(1),
  },

  serachInputWrapper: {
    flex: 1,
    background: theme.palette.total,
    display: "flex",
    borderRadius: 40,
    padding: 4,
    marginRight: theme.spacing(1),
  },

  searchIcon: {
    color: "grey",
    marginLeft: 6,
    marginRight: 6,
    alignSelf: "center",
  },

  searchInput: {
    flex: 1,
    border: "none",
    borderRadius: 30,
  },

  insiderTabPanel: {
    height: '100%',
    marginTop: "-72px",
    paddingTop: "72px"
  },

  insiderDoubleTabPanel: {
    display: "flex",
    flexDirection: "column",
    marginTop: "-72px",
    paddingTop: "72px",
    height: "100%"
  },

  labelContainer: {
    width: "auto",
    padding: 0
  },
  iconLabelWrapper: {
    flexDirection: "row",
    '& > *:first-child': {
      marginBottom: '3px !important',
      marginRight: 16
    }
  },
  insiderTabLabel: {
    [theme.breakpoints.down(1600)]: {
      display: 'none'
    }
  },
  smallFormControl: {
    '& .MuiOutlinedInput-input': {
      padding: "12px 10px",
    },
    '& .MuiInputLabel-outlined': {
      marginTop: "-6px"
    }
  }
}));

const TicketsManagerTabs = () => {
  const classes = useStyles();
  const history = useHistory();

  const [searchParam, setSearchParam] = useState("");
  const [tab, setTab] = useState("open");
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const searchInputRef = useRef();
  const { user } = useContext(AuthContext);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const [openCount, setOpenCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [pendingTickets, setPendingTickets] = useState([]);
  const [searchTickets, setSearchTickets] = useState([]);

  const userQueueIds = user?.queues?.map((q) => q.id) || [];
  const [selectedQueueIds, setSelectedQueueIds] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showGroupTab, setShowTabGroup] = useState(false);

  useEffect(() => {
    if (user?.queues?.length > 0) {
      setSelectedQueueIds(user.queues.map((q) => q.id));
    }
    fetchSettings();

    if (user?.profile?.toUpperCase() === "ADMIN") {
      setShowAllTickets(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/tickets", {
          params: {
            status: tab === "open" ? "open" : tab === "pending" ? "pending" : undefined,
            searchParam,
            showAll: showAllTickets,
            queueIds: JSON.stringify(selectedQueueIds),
            tags: JSON.stringify(selectedTags),
            users: JSON.stringify(selectedUsers)
          }
        });
        
        if (tab === "open") {
          setTickets(data.tickets || []);
          setOpenCount(data.tickets?.length || 0);
        } else if (tab === "pending") {
          setPendingTickets(data.tickets || []);
          setPendingCount(data.tickets?.length || 0);
        } else if (tab === "search") {
          setSearchTickets(data.tickets || []);
        }
        
        setHasMore(data.hasMore || false);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchTickets();
  }, [tab, searchParam, showAllTickets, selectedQueueIds, selectedTags, selectedUsers]);

  useEffect(() => {
    if (tab === "search" && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [tab]);

  let searchTimeout;

  const fetchSettings = async () => {
    try {
      const { data } = await api.get("/settings");
      const showGroups = data.find((s) => s.key === "CheckMsgIsGroup");
      setShowTabGroup(showGroups.value === "disabled");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e) => {
    const searchedTerm = e.target.value.toLowerCase();

    clearTimeout(searchTimeout);

    if (searchedTerm === "") {
      setSearchParam(searchedTerm);
      setTab("open");
      return;
    }

    searchTimeout = setTimeout(() => {
      setSearchParam(searchedTerm);
    }, 500);
  };

  const handleChangeTab = (e, newValue) => {
    setTab(newValue);
  };

  const handleSelectedTags = (selecteds) => {
    setSelectedTags(selecteds);
  };

  const handleSelectedUsers = (selecteds) => {
    setSelectedUsers(selecteds);
  };

  const handleSnackbarOpen = () => {
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const CloseAllTicket = async () => {
    try {
      await api.put("/tickets/closeAll");
      toastSuccess(i18n.t("tickets.inbox.closedAllTickets"));
      handleSnackbarClose();
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <Paper className={classes.ticketsWrapper} square>
      <Paper className={classes.tabsHeader} square>
        <Tabs
          value={tab}
          onChange={handleChangeTab}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab
            value="open"
            icon={
              <Badge badgeContent={openCount} color="secondary">
                <MoveToInboxIcon />
              </Badge>
            }
            label={i18n.t("ticketsList.open")}
          />
          <Tab
            value="pending"
            icon={
              <Badge badgeContent={pendingCount} color="secondary">
                <CheckBoxIcon />
              </Badge>
            }
            label={i18n.t("ticketsList.pending")}
          />
          <Tab
            value="search"
            icon={<SearchIcon />}
            label={i18n.t("ticketsList.search.title")}
          />
        </Tabs>
      </Paper>

      <Paper className={classes.ticketSearchLine} square>
        <div className={classes.serachInputWrapper}>
          <SearchIcon className={classes.searchIcon} />
          <InputBase
            className={classes.searchInput}
            inputRef={searchInputRef}
            placeholder={i18n.t("ticketsList.search.placeholder")}
            type="search"
            value={searchParam}
            onChange={handleSearch}
          />
        </div>
      </Paper>

      <TabPanel value={tab} index="open">
        <TicketsListCustom
          tickets={tickets}
          loading={loading}
          hasMore={hasMore}
          searchParam={searchParam}
          showAll={showAllTickets}
          selectedQueueIds={selectedQueueIds}
          selectedTags={selectedTags}
          selectedUsers={selectedUsers}
        />
      </TabPanel>

      <TabPanel value={tab} index="pending">
        <TicketsListCustom
          tickets={pendingTickets}
          loading={loading}
          hasMore={hasMore}
          searchParam={searchParam}
          showAll={showAllTickets}
          selectedQueueIds={selectedQueueIds}
          selectedTags={selectedTags}
          selectedUsers={selectedUsers}
        />
      </TabPanel>

      <TabPanel value={tab} index="search">
        <TicketsListCustom
          tickets={searchTickets}
          loading={loading}
          hasMore={hasMore}
          searchParam={searchParam}
          showAll={showAllTickets}
          selectedQueueIds={selectedQueueIds}
          selectedTags={selectedTags}
          selectedUsers={selectedUsers}
        />
      </TabPanel>
    </Paper>
  );
};

export default TicketsManagerTabs;
