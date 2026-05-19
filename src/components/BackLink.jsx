import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

function BackLink({ to = "/", onClick, label = "Volver" }) {
  if (onClick) {
    return (
      <button className="back-link" type="button" onClick={onClick} aria-label={label} title={label}>
        <ArrowLeft size={20} />
      </button>
    );
  }

  return (
    <Link className="back-link" to={to} aria-label={label} title={label}>
      <ArrowLeft size={20} />
    </Link>
  );
}

export default BackLink;
