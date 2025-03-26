import { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";
import { has, isArray } from "lodash";

import { toast } from "react-toastify";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";
import moment from "moment";

const useAuth = () => {
  const history = useHistory();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});

  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
        setIsAuth(true);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      if ((error?.response?.status === 401 || error?.response?.status === 403) && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const { data } = await api.post("/auth/refresh_token");
          if (data?.token) {
            localStorage.setItem("token", data.token);
            api.defaults.headers.Authorization = `Bearer ${data.token}`;
            return api(originalRequest);
          }
        } catch (err) {
          localStorage.removeItem("token");
          localStorage.removeItem("companyId");
          localStorage.removeItem("userId");
          setIsAuth(false);
          setUser({});
          history.push("/login");
        }
      }
      return Promise.reject(error);
    }
  );

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
      setIsAuth(true);
      getCurrentUserInfo().then(data => {
        if (data) {
          setUser(data);
        }
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    if (companyId) {
   
    const socket = socketManager.getSocket(companyId);

      socket.on(`company-${companyId}-user`, (data) => {
        if (data.action === "update" && data.user.id === user.id) {
          setUser(data.user);
        }
      });
    
    
    return () => {
      socket.disconnect();
    };
  }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, socketManager]);

  const handleLogin = async (userData) => {
    try {
      const { data } = await api.post("/auth/login", userData);
      const { user: { companyId, id, company } } = data;

      if (has(company, "settings") && isArray(company.settings)) {
        const setting = company.settings.find(s => s.key === "campaignsEnabled");
        if (setting && setting.value === "true") {
          localStorage.setItem("cshow", null);
        }
      }

      moment.locale('pt-br');
      const dueDate = data.user.company.dueDate;
      const vencimento = moment(dueDate).format("DD/MM/yyyy");
      const before = moment().isBefore(dueDate);
      const dias = moment(dueDate).diff(moment(), 'days');

      if (before) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("companyId", companyId);
        localStorage.setItem("userId", id);
        localStorage.setItem("companyDueDate", vencimento);
        
        api.defaults.headers.Authorization = `Bearer ${data.token}`;
        setUser(data.user);
        setIsAuth(true);
        
        toast.success(i18n.t("auth.toasts.success"));
        if (dias < 5) {
          toast.warn(`Sua assinatura vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}`);
        }
        history.push("/tickets");
      } else {
        toast.error(`Opss! Sua assinatura venceu ${vencimento}. Entre em contato com o Suporte para mais informações!`);
      }
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.delete("/auth/logout");
      localStorage.removeItem("token");
      localStorage.removeItem("companyId");
      localStorage.removeItem("userId");
      localStorage.removeItem("cshow");
      api.defaults.headers.Authorization = undefined;
      setIsAuth(false);
      setUser({});
      history.push("/login");
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserInfo = async () => {
    try {
      const { data } = await api.get("/auth/me");
      return data;
    } catch (err) {
      toastError(err);
    }
  };

  return {
    isAuth,
    user,
    loading,
    handleLogin,
    handleLogout,
    getCurrentUserInfo,
  };
};

export default useAuth;
