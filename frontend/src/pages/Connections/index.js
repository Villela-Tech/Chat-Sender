import React, { useState, useCallback, useContext, useEffect } from "react";
import { toast } from "react-toastify";
import { add, format, parseISO } from "date-fns";
import { useHistory } from "react-router-dom";
import moment from "moment";
import clsx from "clsx";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import {
	Button,
	TableBody,
	TableRow,
	TableCell,
	IconButton,
	Table,
	TableHead,
	Paper,
	Tooltip,
	Typography,
	CircularProgress,
	Box,
	Card,
	CardContent,
} from "@material-ui/core";
import {
	Edit,
	CheckCircle,
	SignalCellularConnectedNoInternet2Bar,
	SignalCellularConnectedNoInternet0Bar,
	SignalCellular4Bar,
	CropFree,
	DeleteOutline,
	WhatsApp,
} from "@material-ui/icons";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import TableRowSkeleton from "../../components/TableRowSkeleton";

import api from "../../services/api";
import WhatsAppModal from "../../components/WhatsAppModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import QrcodeModal from "../../components/QrcodeModal";
import { i18n } from "../../translate/i18n";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";

import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../../components/Can";

const useStyles = makeStyles(theme => ({
	mainPaper: {
		flex: 1,
		padding: theme.spacing(1),
		overflowY: "scroll",
		...theme.scrollbarStyles,
	},
	customTableCell: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	},
	tooltip: {
		backgroundColor: "#f5f5f9",
		color: "rgba(0, 0, 0, 0.87)",
		fontSize: theme.typography.pxToRem(14),
		border: "1px solid #dadde9",
		maxWidth: 450,
	},
	tooltipPopper: {
		textAlign: "center",
	},
	buttonProgress: {
		color: green[500],
	},
	sessionButton: {
		fontSize: "0.75rem",
		padding: "4px 8px",
		marginRight: "8px",
	},
	disconnectButton: {
		fontSize: "0.75rem",
		padding: "4px 8px",
		backgroundColor: "#f50057",
		color: "white",
		"&:hover": {
			backgroundColor: "#dc004e",
		},
	},
	whatsappIcon: {
		color: "#25D366",
	},
	countryCode: {
		marginRight: "4px",
		color: "#666",
		fontSize: "0.875rem",
	},
	filterContainer: {
		padding: theme.spacing(2),
		display: 'flex',
		gap: theme.spacing(1),
		alignItems: 'center',
	},
	filterButton: {
		borderRadius: 4,
		'&.active': {
			backgroundColor: green[600],
			color: 'white',
			'&:hover': {
				backgroundColor: green[700],
			},
		},
	},
	actionButtons: {
		display: 'flex',
		gap: '8px',
	},
	actionButton: {
		padding: '6px',
		'& svg': {
			fontSize: '20px',
			color: '#666',
		},
	},
}));

const CustomToolTip = ({ title, content, children }) => {
	const classes = useStyles();

	return (
		<Tooltip
			arrow
			classes={{
				tooltip: classes.tooltip,
				popper: classes.tooltipPopper,
			}}
			title={
				<React.Fragment>
					<Typography gutterBottom color="inherit">
						{title}
					</Typography>
					{content && <Typography>{content}</Typography>}
				</React.Fragment>
			}
		>
			{children}
		</Tooltip>
	);
};

const formatPhoneNumber = (number) => {
	if (!number) return '';
	// Remove todos os caracteres não numéricos
	const cleaned = number.replace(/\D/g, '');
	// Remove o código do país (55) se existir
	const numberWithoutCountry = cleaned.startsWith('55') ? cleaned.slice(2) : cleaned;
	
	// Pega o DDD
	const ddd = numberWithoutCountry.slice(0, 2);
	// Pega o restante do número
	const restNumber = numberWithoutCountry.slice(2);
	// Separa em duas partes: antes do hífen (todos exceto os 4 últimos) e depois do hífen (4 últimos)
	const lastFour = restNumber.slice(-4);
	const firstPart = restNumber.slice(0, restNumber.length - 4);
	
	return `🇧🇷 (${ddd}) ${firstPart}${firstPart ? '-' : ''}${lastFour}`;
};

const Connections = () => {
	const classes = useStyles();
	const history = useHistory();

	const { user } = useContext(AuthContext);
	const { whatsApps, loading } = useContext(WhatsAppsContext);
	const [statusImport, setStatusImport] = useState([]);
	const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
	const [qrModalOpen, setQrModalOpen] = useState(false);
	const [selectedWhatsApp, setSelectedWhatsApp] = useState(null);
	const [confirmModalOpen, setConfirmModalOpen] = useState(false);
	const confirmationModalInitialState = {
		action: "",
		title: "",
		message: "",
		whatsAppId: "",
		open: false,
	};
	const [confirmModalInfo, setConfirmModalInfo] = useState(
		confirmationModalInitialState
	);
	const [statusFilter, setStatusFilter] = useState('all');

	const socketManager = useContext(SocketContext);

	useEffect(() => {
		const companyId = localStorage.getItem("companyId");
		const socket = socketManager.getSocket(companyId);

		socket.on(`importMessages-${user.companyId}`, (data) => {
			if (data.action === "refresh") {
				setStatusImport([]);
				history.go(0);
			}
			if (data.action === "update") {
				setStatusImport(data.status);
			}
		});

		/* return () => {
		  socket.disconnect();
		}; */
	}, [whatsApps, socketManager]);

	const handleStartWhatsAppSession = async whatsAppId => {
		try {
			await api.post(`/whatsappsession/${whatsAppId}`);
		} catch (err) {
			toastError(err);
		}
	};

	const handleRequestNewQrCode = async whatsAppId => {
		try {
			await api.put(`/whatsappsession/${whatsAppId}`);
		} catch (err) {
			toastError(err);
		}
	};

	const openInNewTab = url => {
		window.open(url, '_blank', 'noopener,noreferrer');
	};

	const handleOpenWhatsAppModal = () => {
		setSelectedWhatsApp(null);
		setWhatsAppModalOpen(true);
	};

	const handleCloseWhatsAppModal = useCallback(() => {
		setWhatsAppModalOpen(false);
		setSelectedWhatsApp(null);
	}, [setSelectedWhatsApp, setWhatsAppModalOpen]);

	const handleOpenQrModal = whatsApp => {
		setSelectedWhatsApp(whatsApp);
		setQrModalOpen(true);
	};

	const handleCloseQrModal = useCallback(() => {
		setSelectedWhatsApp(null);
		setQrModalOpen(false);
	}, [setQrModalOpen, setSelectedWhatsApp]);

	const handleEditWhatsApp = whatsApp => {
		setSelectedWhatsApp(whatsApp);
		setWhatsAppModalOpen(true);
	};

	const handleOpenConfirmationModal = (action, whatsAppId) => {
		if (action === "disconnect") {
			setConfirmModalInfo({
				action: action,
				title: i18n.t("connections.confirmationModal.disconnectTitle"),
				message: i18n.t("connections.confirmationModal.disconnectMessage"),
				whatsAppId: whatsAppId,
			});
		}

		if (action === "delete") {
			setConfirmModalInfo({
				action: action,
				title: i18n.t("connections.confirmationModal.deleteTitle"),
				message: i18n.t("connections.confirmationModal.deleteMessage"),
				whatsAppId: whatsAppId,
			});
		}
		if (action === "closedImported") {
			setConfirmModalInfo({
				action: action,
				title: i18n.t("connections.confirmationModal.closedImportedTitle"),
				message: i18n.t("connections.confirmationModal.closedImportedMessage"),
				whatsAppId: whatsAppId,
			});
		}
		setConfirmModalOpen(true);
	};

	const handleSubmitConfirmationModal = async () => {
		if (confirmModalInfo.action === "disconnect") {
			try {
				await api.delete(`/whatsappsession/${confirmModalInfo.whatsAppId}`);
			} catch (err) {
				toastError(err);
			}
		}

		if (confirmModalInfo.action === "delete") {
			try {
				await api.delete(`/whatsapp/${confirmModalInfo.whatsAppId}`);
				toast.success(i18n.t("connections.toasts.deleted"));
			} catch (err) {
				toastError(err);
			}
		}

		if (confirmModalInfo.action === "closedImported") {
			try {
				await api.post(`/closedimported/${confirmModalInfo.whatsAppId}`);
				toast.success(i18n.t("connections.toasts.closedimported"));
			} catch (err) {
				toastError(err);
			}
		}

		setConfirmModalInfo(confirmationModalInitialState);
	};

	function CircularProgressWithLabel(props) {
		return (
			<Box position="relative" display="inline-flex">
				<CircularProgress variant="determinate" {...props} />
				<Box
					top={0}
					left={0}
					bottom={0}
					right={0}
					position="absolute"
					display="flex"
					alignItems="center"
					justifyContent="center"
				>
					<Typography
						variant="caption"
						component="div"
						color="textSecondary"
					>{`${Math.round(props.value)}%`}</Typography>
				</Box>
			</Box>
		);
	}

	const renderImportButton = (whatsApp) => {
		if (whatsApp?.statusImportMessages === "renderButtonCloseTickets") {
			return (
				<Button
					style={{ marginLeft: 12 }}
					size="small"
					variant="outlined"
					color="primary"
					onClick={() => {
						handleOpenConfirmationModal("closedImported", whatsApp.id);
					}}
				>
					{i18n.t("connections.buttons.closedImported")}
				</Button>
			);
		}

		if (whatsApp?.importOldMessages) {
			let isTimeStamp = !isNaN(
				new Date(Math.floor(whatsApp?.statusImportMessages)).getTime()
			);

			if (isTimeStamp) {
				const ultimoStatus = new Date(
					Math.floor(whatsApp?.statusImportMessages)
				).getTime();
				const dataLimite = +add(ultimoStatus, { seconds: +35 }).getTime();
				if (dataLimite > new Date().getTime()) {
					return (
						<>
							<Button
								disabled
								style={{ marginLeft: 12 }}
								size="small"
								endIcon={
									<CircularProgress
										size={12}
										className={classes.buttonProgress}
									/>
								}
								variant="outlined"
								color="primary"
							>
								{i18n.t("connections.buttons.preparing")}
							</Button>
						</>
					);
				}
			}
		}
	};

	const renderActionButtons = whatsApp => {
		return (
			<>
				{whatsApp.status === "qrcode" && (
					<Button
						size="small"
						variant="contained"
						color="primary"
						onClick={() => handleOpenQrModal(whatsApp)}
					>
						{i18n.t("connections.buttons.qrcode")}
					</Button>
				)}
				{whatsApp.status === "DISCONNECTED" && (
					<>
						<Button
							size="small"
							variant="outlined"
							color="primary"
							onClick={() => handleStartWhatsAppSession(whatsApp.id)}
							className={classes.sessionButton}
							style={{ marginRight: '8px' }}
						>
							TENTAR NOVAMENTE
						</Button>
						<Button
							size="small"
							variant="contained"
							color="primary"
							onClick={() => handleOpenQrModal(whatsApp)}
							style={{ backgroundColor: '#00796b', color: 'white' }}
						>
							QR CODE
						</Button>
					</>
				)}
				{whatsApp.status === "qrcode" ? (
					<Button
						size="small"
						variant="contained"
						color="primary"
						onClick={() => handleOpenQrModal(whatsApp)}
						style={{ backgroundColor: '#00796b', color: 'white' }}
					>
						QR CODE
					</Button>
				) : whatsApp.status === "CONNECTED" ? (
					<Button
						size="small"
						variant="outlined"
						onClick={() => handleOpenConfirmationModal("disconnect", whatsApp.id)}
						className={classes.disconnectButton}
					>
						DESCONECTAR
					</Button>
				) : null}
				{whatsApp.status === "OPENING" && (
					<Button size="small" variant="outlined" disabled color="default">
						{i18n.t("connections.buttons.connecting")}
					</Button>
				)}
			</>
		);
	};

	const renderStatusToolTips = whatsApp => {
		return (
			<div className={classes.customTableCell}>
				{whatsApp.status === "DISCONNECTED" && (
					<CustomToolTip
						title={i18n.t("connections.toolTips.disconnected.title")}
						content={i18n.t("connections.toolTips.disconnected.content")}
					>
						<SignalCellularConnectedNoInternet0Bar color="secondary" />
					</CustomToolTip>
				)}
				{whatsApp.status === "OPENING" && (
					<CircularProgress size={24} className={classes.buttonProgress} />
				)}
				{whatsApp.status === "qrcode" && (
					<CustomToolTip
						title={i18n.t("connections.toolTips.qrcode.title")}
						content={i18n.t("connections.toolTips.qrcode.content")}
					>
						<CropFree />
					</CustomToolTip>
				)}
				{whatsApp.status === "CONNECTED" && (
					<CustomToolTip title={i18n.t("connections.toolTips.connected.title")}>
						<SignalCellular4Bar style={{ color: green[500] }} />
					</CustomToolTip>
				)}
				{(whatsApp.status === "TIMEOUT" || whatsApp.status === "PAIRING") && (
					<CustomToolTip
						title={i18n.t("connections.toolTips.timeout.title")}
						content={i18n.t("connections.toolTips.timeout.content")}
					>
						<SignalCellularConnectedNoInternet2Bar color="secondary" />
					</CustomToolTip>
				)}
			</div>
		);
	};

	const filteredWhatsApps = whatsApps?.filter(whatsApp => {
		if (statusFilter === 'connected') {
			return whatsApp.status === 'CONNECTED';
		}
		if (statusFilter === 'disconnected') {
			return whatsApp.status === 'DISCONNECTED' || whatsApp.status === 'qrcode' || whatsApp.status === 'TIMEOUT' || whatsApp.status === 'PAIRING';
		}
		return true;
	});

	return (
		<MainContainer>
			<ConfirmationModal
				title={confirmModalInfo.title}
				open={confirmModalOpen}
				onClose={setConfirmModalOpen}
				onConfirm={handleSubmitConfirmationModal}
			>
				{confirmModalInfo.message}
			</ConfirmationModal>
			<QrcodeModal
				open={qrModalOpen}
				onClose={handleCloseQrModal}
				whatsAppId={!whatsAppModalOpen && selectedWhatsApp?.id}
			/>
			<WhatsAppModal
				open={whatsAppModalOpen}
				onClose={handleCloseWhatsAppModal}
				whatsAppId={!qrModalOpen && selectedWhatsApp?.id}
			/>
			<MainHeader>
				<Title>{i18n.t("connections.title")}</Title>
				<MainHeaderButtonsWrapper>
					<Can
						role={user.profile}
						perform="connections-page:addConnection"
						yes={() => (
							<Button
								variant="contained"
								color="primary"
								onClick={handleOpenWhatsAppModal}
							>
								{i18n.t("connections.buttons.add")}
							</Button>
						)}
					/>
					
					<Button
						variant="contained"
						color="primary"
						onClick={() => openInNewTab(`https://wa.me/${process.env.REACT_APP_NUMBER_SUPPORT}`)}
					>
						<WhatsApp style={{ marginRight: "5px"}} />
						<span>{i18n.t("connections.buttons.support")}</span>
					</Button>
				</MainHeaderButtonsWrapper>
			</MainHeader>
			{statusImport?.all ? (
				<>
					<div style={{ margin: "auto", marginBottom: 12 }}>
						<Card className={classes.root}>
							<CardContent className={classes.content}>
								<Typography component="h5" variant="h5">
									{statusImport?.this === -1 ? i18n.t("connections.buttons.preparing") : i18n.t("connections.buttons.importing")}
								</Typography>
								{statusImport?.this === -1 ?
									<Typography component="h6" variant="h6" align="center">
										<CircularProgress
											size={24}
										/>
									</Typography>
									:
									<>
										<Typography component="h6" variant="h6" align="center">
											{`${i18n.t(`connections.typography.processed`)} ${statusImport?.this} ${i18n.t(`connections.typography.in`)} ${statusImport?.all}  ${i18n.t(`connections.typography.date`)}: ${statusImport?.date} `}
										</Typography>
										<Typography align="center">
											<CircularProgressWithLabel
												style={{ margin: "auto" }}
												value={(statusImport?.this / statusImport?.all) * 100}
											/>
										</Typography>
									</>
								}
							</CardContent>
						</Card>
					</div>
				</>
			) : null}
			<Paper className={classes.mainPaper} variant="outlined">
				<div className={classes.filterContainer}>
					<Button
						variant="outlined"
						className={clsx(classes.filterButton, { active: statusFilter === 'all' })}
						onClick={() => setStatusFilter('all')}
					>
						Todas
					</Button>
					<Button
						variant="outlined"
						className={clsx(classes.filterButton, { active: statusFilter === 'connected' })}
						onClick={() => setStatusFilter('connected')}
					>
						Conectadas
					</Button>
					<Button
						variant="outlined"
						className={clsx(classes.filterButton, { active: statusFilter === 'disconnected' })}
						onClick={() => setStatusFilter('disconnected')}
					>
						Desconectadas
					</Button>
				</div>

				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell align="center">{i18n.t("connections.table.name")}</TableCell>
							<TableCell align="center">{i18n.t("connections.table.status")}</TableCell>
							<TableCell align="center">{i18n.t("connections.table.number")}</TableCell>
							<TableCell align="center">{i18n.t("connections.table.session")}</TableCell>
							<TableCell align="center">{i18n.t("connections.table.lastUpdate")}</TableCell>
							<TableCell align="center">{i18n.t("connections.table.default")}</TableCell>
							<TableCell align="center">{i18n.t("connections.table.actions")}</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{loading ? (
							<TableRowSkeleton />
						) : (
							<>
								{filteredWhatsApps?.length > 0 &&
									filteredWhatsApps.map(whatsApp => (
										<TableRow key={whatsApp.id}>
											<TableCell>
												{whatsApp.name}
											</TableCell>
											<TableCell align="center">
												{whatsApp.status === "CONNECTED" ? (
													<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
														<SignalCellular4Bar style={{ color: green[500] }} />
													</div>
												) : (
													<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
														<SignalCellularConnectedNoInternet0Bar color="secondary" />
													</div>
												)}
											</TableCell>
											<TableCell>
												<div style={{ display: 'flex', alignItems: 'center' }}>
													{formatPhoneNumber(whatsApp.number)}
												</div>
											</TableCell>
											<TableCell align="center">
												{whatsApp.status === "DISCONNECTED" ? (
													<>
														<Button
															size="small"
															variant="outlined"
															color="primary"
															onClick={() => handleStartWhatsAppSession(whatsApp.id)}
															className={classes.sessionButton}
															style={{ marginRight: '8px' }}
														>
															TENTAR NOVAMENTE
														</Button>
														<Button
															size="small"
															variant="contained"
															color="primary"
															onClick={() => handleOpenQrModal(whatsApp)}
															style={{ backgroundColor: '#00796b', color: 'white' }}
														>
															QR CODE
														</Button>
													</>
												) : whatsApp.status === "qrcode" ? (
													<Button
														size="small"
														variant="contained"
														color="primary"
														onClick={() => handleOpenQrModal(whatsApp)}
														style={{ backgroundColor: '#00796b', color: 'white' }}
													>
														QR CODE
													</Button>
												) : whatsApp.status === "CONNECTED" ? (
													<Button
														size="small"
														variant="outlined"
														onClick={() => handleOpenConfirmationModal("disconnect", whatsApp.id)}
														className={classes.disconnectButton}
													>
														DESCONECTAR
													</Button>
												) : null}
											</TableCell>
											<TableCell align="center">
												{format(parseISO(whatsApp.updatedAt), "dd/MM/yy HH:mm")}
											</TableCell>
											<TableCell align="center">
												{whatsApp.isDefault && (
													<CheckCircle style={{ color: green[500] }} />
												)}
											</TableCell>
											<TableCell>
												<div className={classes.actionButtons}>
													<IconButton
														size="small"
														onClick={() => handleEditWhatsApp(whatsApp)}
														className={classes.actionButton}
													>
														<Edit />
													</IconButton>

													<IconButton
														size="small"
														onClick={() => handleOpenConfirmationModal("delete", whatsApp.id)}
														className={classes.actionButton}
													>
														<DeleteOutline />
													</IconButton>
												</div>
											</TableCell>
										</TableRow>
									))}
							</>
						)}
					</TableBody>
				</Table>
			</Paper>
		</MainContainer>
	);
};

export default Connections;
