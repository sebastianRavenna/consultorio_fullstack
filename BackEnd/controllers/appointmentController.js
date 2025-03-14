import { Appointment } from '../models/appointmentModel.js';
import { sendEmail } from '../config/email.js';
import { emailTemplates } from '../utils/emailTemplates.js';
import { User } from '../models/userModel.js'
import { ClinicalHistory } from '../models/clinicalHistoryModel.js';
import jwt from 'jsonwebtoken';

// 📌 1️⃣ Paciente solicita un turno
const requestAppointment = async (req, res) => {
    try {
      const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No autorizado, falta autenticación." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const patientId = decoded.id;
      
      const { date, reason } = req.body;
      let history = await ClinicalHistory.findOne({ user: patientId });

      if (!history) {
        // Si no existe, la creamos
        history = new ClinicalHistory({ user: patientId });
        await history.save();
        console.log("✅ Historia clínica creada para el usuario:", patientId);
      }
    
      const newAppointment = new Appointment({ patient: patientId, date, reason });
      await newAppointment.save();
      
      //envio de mail
      const patient = await User.findById(patientId);
      const formattedDate = new Date(date).toLocaleString("es-AR");

      await sendEmail(
      patient.email,
      "Confirmación de Turno",
      emailTemplates.appointmentBooked(patient.username, formattedDate)
      );
    
      res.status(201).json({ message: "Turno solicitado", appointment: newAppointment });
    } catch (error) {
      res.status(500).json({ message: "Error al solicitar turno" });
    }
  };
// 📌 Paciente cancela su turno
const cancelAppointment = async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`📌 Intentando cancelar turno con ID: ${id}`);

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        console.log("🚨 Turno no encontrado");
        return res.status(404).json({ message: "Turno no encontrado" });
      }

      console.log(`📌 Turno encontrado: ${appointment}`);

      const isPatient = appointment.patient.toString() === req.user.id;
      const isAdmin = req.user.role === "admin";

      if (!isPatient && !isAdmin){
        console.log("⛔ No autorizado para cancelar este turno");
        return res.status(403).json({ message: "No autorizado para cancelar este turno" });
      }
  
      console.log("✅ Usuario autorizado. Eliminando turno...");
      await Appointment.findByIdAndDelete(id);

      //envio de mail
       /* await sendEmail(
        appointment.patient.email,
        "Turno Cancelado",
        emailTemplates.appointmentCancelled(appointment.patient.username, appointment.date.toLocaleString("es-AR"))
      );  */

      res.status(200).json({ message: "Turno cancelado" });
    } catch (error) {
      console.error("❌ Error en el backend al cancelar turno:", error);
      res.status(500).json({ message: "Error al cancelar turno" });
    }
  }; 

  
  
  // 📌 Paciente ve sus turnos
  const getPatientAppointments = async (req, res) => {
    try {
      const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
      console.log(token)
    if (!token) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const appointments = await Appointment.find({ patient: decoded.id });
    
    res.json(appointments);
  } catch (error) {
      return res.status(500).json({ message: "Error al obtener turnos" });
  }
};
  
  // 📌 Profesional ve todos los turnos de todos los pacientes
  const getAllAppointments = async (req, res) => {
    try {
      const appointments = await Appointment.find().populate("patient", "name email");
      res.status(200).json(appointments);
    } catch (error) {
      console.error("🔴 Error en getAllAppointments:", error);
      res.status(500).json({ message: "Error al obtener turnos" });
    }
  };
  
  // 📌 Profesional ve los turnos de un paciente
  const getAppointmentsByPatient = async (req, res) => {
    try {
      const appointments = await Appointment.find({ patient: req.params.id });
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Error en el servidor al obtener turnos del paciente" });
    }
  };

// 📌 6️⃣ Profesional agenda un turno manualmente
const scheduleAppointment = async (req, res) => {
    try {
      const { patientId, date, reason, status } = req.body;
  
      const newAppointment = new Appointment({ 
        patient: patientId, 
        date, 
        reason,
        status
      });

      await newAppointment.save();

      /* // Enviamos un correo de confirmación al paciente y al profesional
      sendConfirmationEmail(patient, newAppointment);
      sendConfirmationEmail(professional, newAppointment);
       */
      res.status(201).json({ message: "Turno agendado por el profesional", appointment: newAppointment });
    } catch (error) {
      res.status(500).json({ message: "Error al agendar turno" });
    }
  };

// 📌 Profesional cambia el estado del turno
const updateAppointmentStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
  
      if (!["Pendiente", "Realizado", "Ausente"].includes(status)) {
        return res.status(400).json({ message: "Estado inválido" });
      }
  
      const appointment = await Appointment.findById(id);
      if (!appointment) return res.status(404).json({ message: "Turno no encontrado" });
  
      appointment.status = status;
      await appointment.save();
  
      res.status(200).json({ message: "Estado del turno actualizado", appointment });
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar el estado del turno" });
    }
};
// 📌 Enviar recordatorio 1 día antes
const sendReminders = async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
  
      const appointments = await Appointment.find({
        date: { 
          $gte: new Date(tomorrow.setHours(0, 0, 0)), 
          $lt: new Date(tomorrow.setHours(23, 59, 59)) 
        }
      }).populate("patient");
  
      for (const appointment of appointments) {
        await sendEmail(
          appointment.patient.email,
          "Recordatorio de Turno",
          emailTemplates.appointmentReminder(appointment.patient.username, appointment.date.toLocaleString("es-AR"))
        );
      }
    } catch (error) {
      console.error("Error enviando recordatorios:", error);
    }
  };
  
  // 📌 Enviar email de feedback (opcional)
const sendFeedbackRequest = async (req, res) => {
    try {
      const { id } = req.params;
      const { sendFeedback } = req.body; // true/false
  
      if (!sendFeedback) return res.status(200).json({ message: "Feedback no solicitado" });
  
      const appointment = await Appointment.findById(id).populate("patient");
      if (!appointment) return res.status(404).json({ message: "Turno no encontrado" });
  
      await sendEmail(
        appointment.patient.email,
        "Cuéntanos tu experiencia",
        emailTemplates.feedbackRequest(appointment.patient.username)
      );
  
      res.status(200).json({ message: "Email de feedback enviado" });
    } catch (error) {
      res.status(500).json({ message: "Error al enviar email de feedback" });
    }
};

export {
    requestAppointment, 
    cancelAppointment, 
    getPatientAppointments, 
    getAllAppointments, 
    getAppointmentsByPatient, 
    scheduleAppointment, 
    updateAppointmentStatus,
    sendReminders, 
    sendFeedbackRequest 
};
