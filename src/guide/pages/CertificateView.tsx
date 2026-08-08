import { GuideIcon } from "../components/icons";
import { getLearningPath } from "../data/learningPaths";
import { formatDate } from "../lib/format";
import { useGuideProgress } from "../context/useGuideProgress";
import { ACADEMY_PROFILE_ROLE_LABELS, type AcademyProfileRole } from "../context/useGuideProgress";

interface CertificateViewProps {
  pathId: string;
  onBack: () => void;
}

const ROLE_OPTIONS: AcademyProfileRole[] = ["owner", "staff", "partner", "promoter", "trainer", "other"];

function verificationUrl(certificateId: string): string {
  return `${window.location.origin}/?module=guide#verify/${certificateId}`;
}

export default function CertificateView({ pathId, onBack }: CertificateViewProps) {
  const { certificates, profile, setProfile } = useGuideProgress();
  const path = getLearningPath(pathId);
  const certificate = certificates[pathId];

  if (!path || !certificate) {
    return (
      <div>
        <div className="wg-breadcrumb">
          <button type="button" onClick={onBack}>Learning Paths</button>
        </div>
        <div className="wg-empty">
          <div className="wg-empty-icon"><GuideIcon.trophy /></div>
          <p className="wg-card-title" style={{ fontSize: "0.95rem" }}>No certificate yet</p>
          <p className="wg-card-body">Complete every lesson in this path to earn its Certificate of Completion.</p>
        </div>
      </div>
    );
  }

  // Exactly one name ever appears on the certificate face. Falling
  // back to email (never a blank, never a second unlabeled name) only
  // when no full name exists anywhere - matching the required
  // resolution order (see lib/identity.ts for how profile got here).
  const recipientName = profile.fullName.trim() || profile.email.trim() || "___________________";
  const roleLabel = ACADEMY_PROFILE_ROLE_LABELS[profile.role];

  return (
    <div className="wg-certificate-page">
      <div className="wg-breadcrumb">
        <button type="button" onClick={onBack}>Learning Paths</button>
        <GuideIcon.chevronRight />
        <span>Certificate</span>
      </div>

      <div className="wg-certificate-profile-form">
        <p className="wg-progress-label" style={{ marginBottom: 10 }}>Recipient details</p>
        <p className="wg-card-body" style={{ marginBottom: 12, fontSize: "0.78rem" }}>
          Filled in automatically where your account already has this on file — edit anything that needs a
          correction. This is the Academy's own profile, separate from Store records, so a Partner or Promoter
          with no Store account can fill it in themselves too.
        </p>
        <div className="wg-certificate-profile-grid">
          <label className="wg-field">
            <span>Full name</span>
            <input
              type="text"
              className="wg-certificate-name-input"
              value={profile.fullName}
              placeholder="Full name"
              onChange={(e) => setProfile({ fullName: e.target.value })}
            />
          </label>
          <label className="wg-field">
            <span>Email</span>
            <input
              type="email"
              className="wg-certificate-name-input"
              value={profile.email}
              placeholder="you@example.com"
              onChange={(e) => setProfile({ email: e.target.value })}
            />
          </label>
          <label className="wg-field">
            <span>Organization / Business (optional)</span>
            <input
              type="text"
              className="wg-certificate-name-input"
              value={profile.organization}
              placeholder="Organization"
              onChange={(e) => setProfile({ organization: e.target.value })}
            />
          </label>
          <label className="wg-field">
            <span>Role</span>
            <select
              className="wg-certificate-name-input"
              value={profile.role}
              onChange={(e) => setProfile({ role: e.target.value as AcademyProfileRole })}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{ACADEMY_PROFILE_ROLE_LABELS[r]}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="wg-certificate">
        <img src="/logo.png" alt="WEGN Store" className="wg-certificate-seal" />
        <p className="wg-certificate-kicker">Certificate of Completion</p>
        <h1 className="wg-certificate-title">WEGN Store Academy</h1>
        <p className="wg-certificate-presented">This certifies that</p>
        <p className="wg-certificate-name">{recipientName}</p>
        <p className="wg-certificate-path">has successfully completed the</p>
        <p className="wg-certificate-path" style={{ color: "var(--g-green-dark)" }}>{path.name} path</p>

        {profile.organization.trim() && (
          <div className="wg-certificate-org">
            <span className="wg-certificate-org-label">Organization</span>
            <span className="wg-certificate-org-value">{profile.organization} · {roleLabel}</span>
          </div>
        )}

        <p className="wg-certificate-date">Awarded {formatDate(certificate.awardedAt)}</p>

        <div className="wg-certificate-signature-row">
          <div className="wg-certificate-signature">
            <span className="wg-certificate-signature-line">WEGN Store Academy</span>
            <span className="wg-certificate-signature-label">Certified By</span>
          </div>
          <div className="wg-certificate-signature">
            <span className="wg-certificate-signature-line">{formatDate(certificate.awardedAt)}</span>
            <span className="wg-certificate-signature-label">Date</span>
          </div>
        </div>

        <p className="wg-certificate-issuer">Issued by WEGN Store Academy</p>

        <div className="wg-certificate-footer">
          <span>{path.lessonIds.length} lessons completed</span>
          <span className="wg-certificate-id">Certificate ID: {certificate.certificateId}</span>
        </div>
        <p className="wg-certificate-verify">Verify at {verificationUrl(certificate.certificateId)}</p>
      </div>

      <div className="wg-certificate-actions">
        <button type="button" className="wg-btn wg-btn-primary" onClick={() => window.print()}>
          <GuideIcon.check /> Print or save as PDF
        </button>
      </div>
    </div>
  );
}
