import resend

from app.core.config import settings
from app.schemas.cita import CitaDetalleOut

FROM_EMAIL = "BarberOS <noreply@barberos.com>"


def _fecha_legible(dt) -> str:
    dias = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
    meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
    ]
    dia_nombre = dias[dt.weekday()]
    return f"{dia_nombre} {dt.day} de {meses[dt.month - 1]} de {dt.year} a las {dt.strftime('%H:%M')}"


def _html_base(titulo: str, cuerpo: str) -> str:
    return f"""
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>{titulo}</title></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
  <h2 style="color:#1a1a1a;border-bottom:2px solid #e0e0e0;padding-bottom:10px">{titulo}</h2>
  {cuerpo}
  <hr style="border:none;border-top:1px solid #e0e0e0;margin-top:30px">
  <p style="font-size:12px;color:#888">BarberOS — Sistema de gestión de citas</p>
</body>
</html>
"""


def _detalle_cita_html(cita: CitaDetalleOut) -> str:
    return f"""
  <table style="border-collapse:collapse;width:100%;margin:16px 0">
    <tr><td style="padding:8px;font-weight:bold;width:140px">Barbero</td>
        <td style="padding:8px">{cita.barbero.nombre}</td></tr>
    <tr style="background:#f9f9f9">
        <td style="padding:8px;font-weight:bold">Servicio</td>
        <td style="padding:8px">{cita.servicio.nombre}</td></tr>
    <tr><td style="padding:8px;font-weight:bold">Fecha y hora</td>
        <td style="padding:8px">{_fecha_legible(cita.fecha_hora)}</td></tr>
  </table>
"""


def send_confirmacion_cita(cita: CitaDetalleOut) -> None:
    resend.api_key = settings.RESEND_API_KEY

    cancelar_url = f"https://barberos.com/citas/{cita.id}/cancelar"
    reagendar_url = f"https://barberos.com/citas/{cita.id}/reagendar"

    cuerpo = f"""
  <p>Hola <strong>{cita.cliente.nombre}</strong>, tu cita ha sido confirmada.</p>
  {_detalle_cita_html(cita)}
  <p>
    <a href="{cancelar_url}" style="background:#e53e3e;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;margin-right:10px">
      Cancelar cita
    </a>
    <a href="{reagendar_url}" style="background:#3182ce;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px">
      Reagendar
    </a>
  </p>
  <p style="font-size:13px;color:#666">Puedes cancelar tu cita hasta 1 hora antes de la hora programada.</p>
"""

    resend.Emails.send({
        "from": FROM_EMAIL,
        "to": [cita.cliente.email],
        "subject": f"Cita confirmada — {cita.servicio.nombre}",
        "html": _html_base("Cita confirmada", cuerpo),
    })


def send_cancelacion_por_barberia(cita: CitaDetalleOut) -> None:
    resend.api_key = settings.RESEND_API_KEY

    cuerpo = f"""
  <p>Hola <strong>{cita.cliente.nombre}</strong>,</p>
  <p>Lamentamos informarte que tu cita ha sido <strong>cancelada por la barbería</strong>.</p>
  {_detalle_cita_html(cita)}
  <p>Por favor contáctanos para reagendar tu cita.</p>
"""

    resend.Emails.send({
        "from": FROM_EMAIL,
        "to": [cita.cliente.email],
        "subject": "Tu cita ha sido cancelada",
        "html": _html_base("Cita cancelada por la barbería", cuerpo),
    })


def send_recordatorio(cita: CitaDetalleOut, horas_antes: int) -> None:
    resend.api_key = settings.RESEND_API_KEY

    cancelar_url = f"https://barberos.com/citas/{cita.id}/cancelar"

    if horas_antes == 24:
        encabezado = "Recordatorio: tu cita es mañana"
        intro = "Te recordamos que tienes una cita <strong>mañana</strong>."
    else:
        encabezado = "Recordatorio: tu cita es en 2 horas"
        intro = "Tu cita comienza en aproximadamente <strong>2 horas</strong>."

    cuerpo = f"""
  <p>Hola <strong>{cita.cliente.nombre}</strong>,</p>
  <p>{intro}</p>
  {_detalle_cita_html(cita)}
  <p>
    <a href="{cancelar_url}" style="background:#e53e3e;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px">
      Cancelar cita
    </a>
  </p>
"""

    resend.Emails.send({
        "from": FROM_EMAIL,
        "to": [cita.cliente.email],
        "subject": encabezado,
        "html": _html_base(encabezado, cuerpo),
    })
