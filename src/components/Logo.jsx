export default function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#1e4a34" />
      <path d="M15 11l11 4.5L15 20z" fill="#e8b931" />
      <path d="M15 11v19" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}