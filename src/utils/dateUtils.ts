// src/utils/dateUtils.ts

import { Timestamp } from 'firebase/firestore';

/**
 * ⏰ Formatear timestamp de Firebase
 */
export const formatTimestamp = (timestamp: Timestamp): string => {
  try {
    return timestamp.toDate().toLocaleString();
  } catch (error) {
    return 'Fecha no disponible';
  }
};

/**
 * ⏱️ Obtener tiempo relativo (ej: "hace 2 min")
 */
export const getTimeAgo = (timestamp: Timestamp): string => {
  try {
    const now = new Date();
    const messageDate = timestamp.toDate();
    const diffInMs = now.getTime() - messageDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    // Menos de 1 minuto
    if (diffInMinutes < 1) {
      return 'Ahora';
    }
    
    // Menos de 1 hora
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    }
    
    // Menos de 24 horas
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    }
    
    // Menos de 7 días
    if (diffInDays < 7) {
      return `${diffInDays}d`;
    }

    // Más de 7 días - mostrar fecha
    const isThisYear = messageDate.getFullYear() === now.getFullYear();
    
    if (isThisYear) {
      return messageDate.toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric'
      });
    } else {
      return messageDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  } catch (error) {
    return '--';
  }
};

/**
 * 📅 Formatear fecha para el chat (ej: "Hoy", "Ayer", "15 Mar")
 */
export const formatChatDate = (timestamp: Timestamp): string => {
  try {
    const messageDate = timestamp.toDate();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Normalizar fechas para comparación (sin hora)
    const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (messageDateOnly.getTime() === todayOnly.getTime()) {
      return 'Hoy';
    } else if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Ayer';
    } else {
      const isThisYear = messageDate.getFullYear() === today.getFullYear();
      
      if (isThisYear) {
        return messageDate.toLocaleDateString('es-ES', {
          month: 'short',
          day: 'numeric'
        });
      } else {
        return messageDate.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    }
  } catch (error) {
    return 'Fecha no disponible';
  }
};

/**
 * 🕐 Formatear hora (ej: "14:30")
 */
export const formatTime = (timestamp: Timestamp): string => {
  try {
    return timestamp.toDate().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    return '--:--';
  }
};

/**
 * 📊 Verificar si dos timestamps son del mismo día
 */
export const isSameDay = (timestamp1: Timestamp, timestamp2: Timestamp): boolean => {
  try {
    const date1 = timestamp1.toDate();
    const date2 = timestamp2.toDate();
    
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  } catch (error) {
    return false;
  }
};

/**
 * ⏰ Verificar si el mensaje es reciente (menos de 5 minutos)
 */
export const isRecentMessage = (timestamp: Timestamp): boolean => {
  try {
    const now = new Date();
    const messageDate = timestamp.toDate();
    const diffInMs = now.getTime() - messageDate.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);
    
    return diffInMinutes < 5;
  } catch (error) {
    return false;
  }
};

/**
 * 📅 Obtener fecha para agrupar mensajes
 */
export const getMessageGroupDate = (timestamp: Timestamp): string => {
  try {
    const messageDate = timestamp.toDate();
    const today = new Date();
    
    // Si es de hoy, agrupar por horas
    if (isSameDay(timestamp, Timestamp.fromDate(today))) {
      const hour = messageDate.getHours();
      
      if (hour < 6) return 'Madrugada';
      if (hour < 12) return 'Mañana';
      if (hour < 18) return 'Tarde';
      return 'Noche';
    }
    
    // Si no es de hoy, usar fecha
    return formatChatDate(timestamp);
  } catch (error) {
    return 'Fecha desconocida';
  }
};

