import { useState, useContext } from "react";
import { requestAppointment } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AppointmentForm = () => {
  const { token } = useContext(AuthContext);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !reason) {
      setMessage("Todos los campos son obligatorios.");
      return;
    }

    try {
      const response = await requestAppointment(date, reason, token);
      if (response.data && response.data.appointment) {
        addAppointment(response.data.appointment);
      }
      setMessage("✅ Turno solicitado correctamente.");
      setDate("");
      setReason("");
      window.location.reload("/Dashboard");
      window.location.reload("/admin" );
    } catch (error) {
      setMessage("❌ Error al solicitar el turno.");
    }
  };

  return (
    <div className="box">
      <h2 className="title is-4">Solicitar Turno</h2>
      {message && <p className="notification">{message}</p>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="label">Fecha y Hora</label>
          <div className="control">
            <input
              type="datetime-local"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Motivo</label>
          <div className="control">
            <textarea
              className="textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            ></textarea>
          </div>
        </div>

        <div className="field">
          <div className="control">
            <button className="button is-primary" type="submit">
              Solicitar Turno
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export { AppointmentForm };
