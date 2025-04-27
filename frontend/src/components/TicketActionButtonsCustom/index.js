import React, { useContext, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

import { makeStyles, createTheme, ThemeProvider } from "@material-ui/core/styles";
import { 
	IconButton, 
	Tooltip, 
	Dialog, 
	DialogTitle, 
	DialogContent, 
	DialogActions, 
	Button,
	TextField,
	FormControl,
	FormControlLabel,
	Radio,
	RadioGroup,
	Typography
} from "@material-ui/core";
import { MoreVert, Replay, Phone } from "@material-ui/icons";
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import PictureAsPdfIcon from '@material-ui/icons/PictureAsPdf';

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import TicketOptionsMenu from "../TicketOptionsMenu";
import ButtonWithSpinner from "../ButtonWithSpinner";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import UndoRoundedIcon from '@material-ui/icons/UndoRounded';
import { green } from '@material-ui/core/colors';
import { SocketContext } from "../../context/Socket/SocketContext";


const useStyles = makeStyles(theme => ({
	actionButtons: {
		marginRight: 6,
		flex: "none",
		alignSelf: "center",
		marginLeft: "auto",
		"& > *": {
			margin: theme.spacing(0.5),
		},
	},
	modalContent: {
		padding: theme.spacing(2),
		'& > *': {
			margin: theme.spacing(1, 0),
		},
	},
	formControl: {
		width: '100%',
		marginBottom: theme.spacing(2),
	},
	radioGroup: {
		flexDirection: 'row',
	}
}));

const TicketActionButtonsCustom = ({ ticket }) => {
	const classes = useStyles();
	const history = useHistory();
	const [anchorEl, setAnchorEl] = useState(null);
	const [loading, setLoading] = useState(false);
	const ticketOptionsMenuOpen = Boolean(anchorEl);
	const { user } = useContext(AuthContext);
	const { setCurrentTicket } = useContext(TicketsContext);
	const socketManager = useContext(SocketContext);
	const [sendingToMake, setSendingToMake] = useState(false);
	const [openModal, setOpenModal] = useState(false);
	const [formData, setFormData] = useState({
		nomeEmpresa: '',
		cnpjEmpresa: '',
		fezAgendamento: 'nao',
		nomeAssessor: ''
	});

	const customTheme = createTheme({
		palette: {
			primary: green,
		}
	});

	const handleOpenTicketOptionsMenu = e => {
		setAnchorEl(e.currentTarget);
	};

	const handleCloseTicketOptionsMenu = e => {
		setAnchorEl(null);
	};

	const handleUpdateTicketStatus = async (e, status, userId) => {
		setLoading(true);
		try {
			const { data: updatedTicket } = await api.put(`/tickets/${ticket.id}`, {
				status: status,
				userId: userId || null,
				useIntegration: status === "closed" ? false : ticket.useIntegration,
				promptId: status === "closed" ? false : ticket.promptId,
				integrationId: status === "closed" ? false : ticket.integrationId
			});

			setLoading(false);
			if (status === "open") {
				setCurrentTicket({ ...updatedTicket, code: "#open" });
			} else {
				setCurrentTicket({ id: null, code: null });
				// Força a atualização da lista antes de redirecionar
				const socket = socketManager.getSocket(localStorage.getItem("companyId"));
				socket.emit("ticket:update", {
					ticketId: ticket.id,
					ticket: updatedTicket,
					action: "update"
				});

				if (status === "closed") {
					socket.emit(`company-${localStorage.getItem("companyId")}-ticket`, {
						action: "delete",
						ticketId: ticket.id
					});
				}
				
				setTimeout(() => {
					history.push("/tickets");
				}, 100);
			}
		} catch (err) {
			setLoading(false);
			toastError(err);
		}
	};

	const handleOpenWavoipCall = () => {
		if (!ticket?.whatsapp?.wavoip || !ticket?.contact?.number) {
			toastError("Erro: Token ou número de telefone não disponível.");
			return;
		}

		const token = ticket.whatsapp.wavoip;
		const phone = ticket.contact.number.replace(/\D/g, "");
		const name = ticket.contact.name;
		const url = `https://app.wavoip.com/call?token=${token}&phone=${phone}&name=${name}&start_if_ready=true&close_after_call=true`;

		window.open(url, "wavoip", "toolbar=no,scrollbars=no,resizable=no,top=500,left=500,width=500,height=700");
	};

	const generatePDF = async (messages) => {
		try {
			// Inicializa o jsPDF com configurações específicas
			const doc = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4'
			});

			// Configuração de fonte para suportar caracteres especiais
			doc.setFont("helvetica");
			
			// Cabeçalho
			doc.setFontSize(16);
			doc.text('Histórico da Conversa', 105, 15, { align: 'center' });
			
			// Informações do ticket
			doc.setFontSize(12);
			const ticketInfo = [
				`Contato: ${ticket?.contact?.name || ''}`,
				`Número: ${ticket?.contact?.number || ''}`,
				`Protocolo: ${ticket?.protocol || ''}`,
				`Fila: ${ticket?.queue?.name || ''}`,
				`Atendente: ${ticket?.user?.name || ''}`,
				`Tags: ${Array.isArray(ticket?.tags) ? ticket.tags.map(t => t?.tag || '').join(', ') : ''}`
			];

			let yPos = 30;
			ticketInfo.forEach(info => {
				doc.text(info, 15, yPos);
				yPos += 7;
			});

			// Preparar dados das mensagens
			const messageRows = messages.map(msg => [
				new Date(msg?.createdAt || Date.now()).toLocaleString(),
				msg?.fromMe ? 'Atendente' : (ticket?.contact?.name || 'Cliente'),
				msg?.body || msg?.mediaUrl || ''
			]);

			// Adicionar mensagens como texto simples
			yPos += 10;
			doc.text('Mensagens:', 15, yPos);
			messageRows.forEach(row => {
				yPos += 7;
				if (yPos > 280) { // Se estiver próximo do fim da página
					doc.addPage();
					yPos = 20;
				}
				doc.text(`${row[0]} - ${row[1]}: ${row[2]}`, 15, yPos, {
					maxWidth: 180
				});
			});

			// Retorna o PDF em base64
			return doc.output('base64');
		} catch (error) {
			console.error('Erro ao gerar PDF:', error);
			throw new Error('Não foi possível gerar o PDF. Por favor, tente novamente.');
		}
	};

	const handleModalOpen = () => {
		setOpenModal(true);
	};

	const handleModalClose = () => {
		setOpenModal(false);
		setFormData({
			nomeEmpresa: '',
			cnpjEmpresa: '',
			fezAgendamento: 'nao',
			nomeAssessor: ''
		});
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
	};

	const handleSendToMake = async () => {
		setSendingToMake(true);
		try {
			// Buscar as mensagens do ticket
			const { data: messagesResponse } = await api.get(`/messages/${ticket.id}`);
			
			// Processar mensagens em formato simplificado
			const mensagens = Array.isArray(messagesResponse?.messages) 
				? messagesResponse.messages.map(msg => {
					const data = new Date(msg?.createdAt || Date.now()).toLocaleString();
					const remetente = msg?.fromMe ? ticket?.user?.name || 'Atendente' : ticket?.contact?.name || 'Cliente';
					const texto = msg?.body || '';
					
					return {
						mensagem: `${data} - ${remetente}: ${texto}`,
						anexo: msg?.mediaUrl ? msg?.mediaUrl : null,
						tipoAnexo: msg?.mediaType || null
					};
				})
				: [];

			// Gerar PDF
			const pdfBase64 = await generatePDF(messagesResponse?.messages || []);

			// Montar o payload com as informações do formulário
			const payload = {
				"Bundle 1": {
					dadosEmpresa: {
						nome: formData.nomeEmpresa,
						cnpj: formData.cnpjEmpresa,
						fezAgendamento: formData.fezAgendamento === 'sim' ? 'Sim' : 'Não',
						assessor: formData.nomeAssessor
					},
					dadosContato: {
						nome: ticket?.contact?.name || '',
						telefone: ticket?.contact?.number || '',
						email: ticket?.contact?.email || '',
						fotoPerfil: ticket?.contact?.profilePicUrl || '',
						criadoEm: ticket?.contact?.createdAt || ''
					},
					dadosTicket: {
						id: String(ticket?.id || ''),
						protocolo: ticket?.protocol || '',
						status: ticket?.status || 'open',
						fila: ticket?.queue?.name || '',
						idFila: String(ticket?.queueId || ''),
						idWhatsapp: String(ticket?.whatsappId || ''),
						atendente: ticket?.user?.name || '',
						idAtendente: String(ticket?.userId || ''),
						etiquetas: Array.isArray(ticket?.tags) ? ticket.tags.map(t => t?.tag || '') : [],
						criadoEm: ticket?.createdAt || '',
						atualizadoEm: ticket?.updatedAt || '',
						ultimaMensagem: ticket?.lastMessage || ''
					},
					mensagens: mensagens,
					anexos: {
						pdf: {
							nome: `historico_${ticket?.protocol || ticket?.id}_${new Date().toISOString().split('T')[0]}.pdf`,
							conteudo: pdfBase64 || ''
						}
					}
				}
			};

			// Enviar para o webhook do Make
			const response = await axios.post('https://hook.us1.make.com/gkaw446tdbqqgmgunrkto8zuw1w55c3k', payload);
			console.log('Resposta do Make:', response.data);
			toastError('Enviado para o MAKE com sucesso!');
			handleModalClose();
		} catch (err) {
			console.error('Erro ao enviar para o Make:', err);
			toastError(err?.response?.data?.message || 'Erro ao enviar para o MAKE');
		}
		setSendingToMake(false);
	};

	const handleDownloadPDF = async () => {
		try {
			// Buscar as mensagens do ticket
			const { data: messagesResponse } = await api.get(`/messages/${ticket.id}`);
			
			// Processar mensagens
			const messages = Array.isArray(messagesResponse?.messages) 
				? messagesResponse.messages.map(msg => ({
					data: new Date(msg?.createdAt || Date.now()).toLocaleString(),
					tipo: msg?.fromMe ? 'Enviada' : 'Recebida',
					remetente: msg?.fromMe ? ticket?.user?.name || 'Atendente' : ticket?.contact?.name || 'Cliente',
					mensagem: msg?.body || '',
					midia: msg?.mediaUrl ? {
						url: msg?.mediaUrl,
						tipo: msg?.mediaType
					} : null
				}))
				: [];
			
			// Gerar PDF
			const doc = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4'
			});

			// Configuração de fonte para suportar caracteres especiais
			doc.setFont("helvetica");
			
			// Cabeçalho
			doc.setFontSize(16);
			doc.text('Histórico da Conversa', 105, 15, { align: 'center' });
			
			// Informações do ticket
			doc.setFontSize(12);
			const ticketInfo = [
				`Contato: ${ticket?.contact?.name || ''}`,
				`Número: ${ticket?.contact?.number || ''}`,
				`Protocolo: ${ticket?.protocol || ''}`,
				`Fila: ${ticket?.queue?.name || ''}`,
				`Atendente: ${ticket?.user?.name || ''}`,
				`Tags: ${Array.isArray(ticket?.tags) ? ticket.tags.map(t => t?.tag || '').join(', ') : ''}`
			];

			let yPos = 30;
			ticketInfo.forEach(info => {
				doc.text(info, 15, yPos);
				yPos += 7;
			});

			// Adicionar mensagens
			yPos += 10;
			doc.text('Mensagens:', 15, yPos);
			messages.forEach(msg => {
				yPos += 7;
				if (yPos > 280) {
					doc.addPage();
					yPos = 20;
				}
				const texto = `${msg.data} - ${msg.remetente}: ${msg.mensagem}`;
				doc.text(texto, 15, yPos, {
					maxWidth: 180
				});
				if (msg.midia) {
					yPos += 5;
					doc.text(`[Mídia: ${msg.midia.tipo}] - ${msg.midia.url}`, 20, yPos, {
						maxWidth: 170
					});
				}
			});

			// Download do PDF
			const nomeArquivo = `historico_${ticket?.protocol || ticket?.id}_${new Date().toISOString().split('T')[0]}.pdf`;
			doc.save(nomeArquivo);
		} catch (error) {
			console.error('Erro ao gerar PDF:', error);
			toastError('Erro ao gerar PDF');
		}
	};

	return (
		<>
			<div className={classes.actionButtons}>
				<IconButton color="secondary" onClick={handleOpenWavoipCall}>
					<Phone />
				</IconButton>

				{ticket.status === "closed" && (
					<ButtonWithSpinner
						loading={loading}
						startIcon={<Replay />}
						size="small"
						onClick={e => handleUpdateTicketStatus(e, "open", user?.id)}
					>
						{i18n.t("messagesList.header.buttons.reopen")}
					</ButtonWithSpinner>
				)}
				{ticket.status === "open" && (
					<>
						<Tooltip title={i18n.t("messagesList.header.buttons.return")}>
							<IconButton onClick={e => handleUpdateTicketStatus(e, "pending", null)}>
								<UndoRoundedIcon />
							</IconButton>
						</Tooltip>
						<ThemeProvider theme={customTheme}>
							<Tooltip title={i18n.t("messagesList.header.buttons.resolve")}>
								<IconButton onClick={e => handleUpdateTicketStatus(e, "closed", user?.id)} color="primary">
									<CheckCircleIcon />
								</IconButton>
							</Tooltip>
						</ThemeProvider>
						<IconButton onClick={handleOpenTicketOptionsMenu}>
							<MoreVert />
						</IconButton>
						<TicketOptionsMenu
							ticket={ticket}
							anchorEl={anchorEl}
							menuOpen={ticketOptionsMenuOpen}
							handleClose={handleCloseTicketOptionsMenu}
						/>
					</>
				)}
				{ticket.status === "pending" && (
					<ButtonWithSpinner
						loading={loading}
						size="small"
						variant="contained"
						color="primary"
						onClick={e => handleUpdateTicketStatus(e, "open", user?.id)}
					>
						{i18n.t("messagesList.header.buttons.accept")}
					</ButtonWithSpinner>
				)}

				<Tooltip title="Enviar para o Bitrix/MAKE">
					<span>
						<IconButton 
							onClick={handleModalOpen} 
							disabled={!ticket?.id} 
							color="primary"
						>
							<CloudUploadIcon />
						</IconButton>
					</span>
				</Tooltip>

				<Tooltip title="Baixar PDF do Histórico">
					<span>
						<IconButton 
							onClick={handleDownloadPDF}
							disabled={!ticket?.id}
							color="primary"
						>
							<PictureAsPdfIcon />
						</IconButton>
					</span>
				</Tooltip>
			</div>

			<Dialog 
				open={openModal} 
				onClose={handleModalClose}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>
					Enviar para Bitrix
				</DialogTitle>
				<DialogContent className={classes.modalContent}>
					<FormControl className={classes.formControl}>
						<TextField
							label="Nome da Empresa"
							name="nomeEmpresa"
							value={formData.nomeEmpresa}
							onChange={handleInputChange}
							variant="outlined"
							fullWidth
							required
						/>
					</FormControl>

					<FormControl className={classes.formControl}>
						<TextField
							label="CNPJ da Empresa"
							name="cnpjEmpresa"
							value={formData.cnpjEmpresa}
							onChange={handleInputChange}
							variant="outlined"
							fullWidth
							required
						/>
					</FormControl>

					<FormControl component="fieldset" className={classes.formControl}>
						<Typography variant="subtitle1">Foi feito agendamento?</Typography>
						<RadioGroup
							name="fezAgendamento"
							value={formData.fezAgendamento}
							onChange={handleInputChange}
							className={classes.radioGroup}
						>
							<FormControlLabel 
								value="sim" 
								control={<Radio color="primary" />} 
								label="Sim" 
							/>
							<FormControlLabel 
								value="nao" 
								control={<Radio color="primary" />} 
								label="Não" 
							/>
						</RadioGroup>
					</FormControl>

					<FormControl className={classes.formControl}>
						<TextField
							label="Nome do Assessor"
							name="nomeAssessor"
							value={formData.nomeAssessor}
							onChange={handleInputChange}
							variant="outlined"
							fullWidth
							required
						/>
					</FormControl>
				</DialogContent>
				<DialogActions>
					<Button 
						onClick={handleModalClose} 
						color="secondary"
						variant="outlined"
					>
						Cancelar
					</Button>
					<Button 
						onClick={handleSendToMake}
						color="primary"
						variant="contained"
						disabled={sendingToMake || !formData.nomeEmpresa || !formData.cnpjEmpresa || !formData.nomeAssessor}
					>
						Enviar para Bitrix
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default TicketActionButtonsCustom;
