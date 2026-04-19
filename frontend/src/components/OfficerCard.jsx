import { Briefcase, Mail, Phone, User } from 'lucide-react';

const Row = ({ icon, children }) => {
  const IconComponent = icon;
  return (
    <div className="gov-row">
      <span className="gov-row-ic" aria-hidden="true">
        <IconComponent size={18} />
      </span>
      <span className="gov-row-txt">{children}</span>
    </div>
  );
};

export default function OfficerCard({ officer }) {
  const name = officer?.name || '—';
  const designation = officer?.designation || '—';
  const email = officer?.email || '';
  const mobile = officer?.mobile || '';

  return (
    <div className="gov-service-card">
      <div className="gov-card-body">
        <div className="gov-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} aria-hidden="true" />
          <span>{name}</span>
        </div>

        <Row icon={Briefcase}>
          <span className="officer-designation">{designation}</span>
        </Row>

        <Row icon={Mail}>
          {email ? (
            <a href={`mailto:${email}`}>{email}</a>
          ) : (
            '—'
          )}
        </Row>

        <Row icon={Phone}>
          {mobile ? (
            <a className="gov-phone" href={`tel:${mobile}`}>{mobile}</a>
          ) : (
            '—'
          )}
        </Row>
      </div>
    </div>
  );
}
