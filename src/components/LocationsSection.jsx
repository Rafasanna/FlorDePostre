import { MapPin } from "lucide-react";

const locations = [
  {
    id: "flor-de-postre-principal",
    nombre: "Flor de Postre",
    direccion: "3 de Febrero 75",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=3%20de%20Febrero%2075",
    horarios: [
      {
        dias: "Lunes a viernes",
        franjas: ["7:30 hs a 13:00 hs", "16:30 hs a 20:30 hs"]
      },
      {
        dias: "Sábados",
        franjas: ["9:00 hs a 13:30 hs", "16:30 hs a 20:30 hs"]
      }
    ]
  }
];

function LocationsSection() {
  return (
    <section className="locations-section" aria-labelledby="locations-title">
      <div className="section-heading compact">
        <span>Visitanos</span>
        <h2 id="locations-title">Dónde encontrarnos</h2>
        <p>Te esperamos en el local para elegir algo rico, retirar tu pedido o coordinar una propuesta especial.</p>
      </div>

      <div className="locations-grid">
        {locations.map((location) => (
          <article className="location-card" key={location.id}>
            <div className="location-card-header">
              <span className="location-icon" aria-hidden="true">
                <MapPin size={20} />
              </span>
              <div>
                <h3>{location.nombre}</h3>
                <p>{location.direccion}</p>
              </div>
            </div>

            <div className="location-hours" aria-label={`Horarios de ${location.nombre}`}>
              {location.horarios.map((schedule) => (
                <div className="location-schedule" key={schedule.dias}>
                  <strong>{schedule.dias}</strong>
                  {schedule.franjas.map((franja) => (
                    <span key={franja}>{franja}</span>
                  ))}
                </div>
              ))}
            </div>

            <a className="primary-button location-map-button" href={location.mapsUrl} target="_blank" rel="noreferrer">
              <MapPin size={18} />
              Ver ubicación en Google Maps
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

export default LocationsSection;
