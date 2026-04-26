import React from 'react';

interface MedIconProps {
  name: string;
  size?: number;
  color?: string;
}

const ICONS: Record<string, React.FC<{ size: number; color: string }>> = {
  bone: ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 10c.7-.7 1.69-.7 2.5 0a1.77 1.77 0 0 1 0 2.5c-.31.31-.58.44-.67.67-.09.23.05.52.17.84A1.77 1.77 0 0 1 17 16.5c-.7.7-1.69.7-2.5 0-.31-.31-.44-.58-.67-.67-.23-.09-.52.05-.84.17A1.77 1.77 0 0 1 11.5 14c-.7.7-.7 1.69 0 2.5a1.77 1.77 0 0 1-2.5 2.5c-.31-.31-.44-.58-.67-.67-.23-.09-.52.05-.84.17A1.77 1.77 0 0 1 5 16.5c-.7-.7-.7-1.69 0-2.5.31-.31.44-.58.67-.67.23-.09.05-.52-.17-.84A1.77 1.77 0 0 1 7 10c.7-.7 1.69-.7 2.5 0 .31.31.58.44.67.67.09.23-.05.52-.17.84A1.77 1.77 0 0 1 12 9c.7-.7.7-1.69 0-2.5a1.77 1.77 0 0 1 2.5-2.5c.31.31.44.58.67.67.23.09.52-.05.84-.17A1.77 1.77 0 0 1 17 7c.7.7.7 1.69 0 2.5-.31.31-.58.44-.67.67-.09.23.05.52.17.84z"/>
    </svg>
  ),

  spine: ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="4" rx="1"/>
      <rect x="9" y="10" width="6" height="4" rx="1"/>
      <rect x="9" y="18" width="6" height="4" rx="1"/>
      <line x1="12" y1="6" x2="12" y2="10"/>
      <line x1="12" y1="14" x2="12" y2="18"/>
      <line x1="9" y1="4" x2="6" y2="4"/>
      <line x1="15" y1="4" x2="18" y2="4"/>
      <line x1="9" y1="12" x2="6" y2="12"/>
      <line x1="15" y1="12" x2="18" y2="12"/>
      <line x1="9" y1="20" x2="6" y2="20"/>
      <line x1="15" y1="20" x2="18" y2="20"/>
    </svg>
  ),

  knee: ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v8l-2 4 2 4v4"/>
      <path d="M16 2v8l2 4-2 4v4"/>
      <ellipse cx="12" cy="12" rx="4" ry="3"/>
      <line x1="8" y1="10" x2="16" y2="10"/>
      <line x1="8" y1="14" x2="16" y2="14"/>
    </svg>
  ),

  shoulder: ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M12 12v10"/>
      <path d="M8 8C5 8 3 10 3 13"/>
      <path d="M3 13c0 2 1.5 3.5 3.5 3.5"/>
      <path d="M12 8c3 0 5 2 5 5"/>
    </svg>
  ),

  nerve: ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4"/>
      <path d="M12 6c0 0-4 2-4 6s4 6 4 10"/>
      <path d="M12 6c0 0 4 2 4 6s-4 6-4 10"/>
      <path d="M8 12h8"/>
      <circle cx="12" cy="2" r="1" fill={color}/>
      <circle cx="12" cy="22" r="1" fill={color}/>
    </svg>
  ),

  joint: ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v6M12 16v6M2 12h6M16 12h6"/>
      <path d="M5.64 5.64l4.24 4.24M14.12 14.12l4.24 4.24"/>
      <path d="M5.64 18.36l4.24-4.24M14.12 9.88l4.24-4.24"/>
    </svg>
  ),

  joints: ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="5" r="2.5"/>
      <circle cx="19" cy="5" r="2.5"/>
      <circle cx="12" cy="12" r="2.5"/>
      <circle cx="5" cy="19" r="2.5"/>
      <circle cx="19" cy="19" r="2.5"/>
      <line x1="7.5" y1="5" x2="16.5" y2="5"/>
      <line x1="7.5" y1="19" x2="16.5" y2="19"/>
      <line x1="5" y1="7.5" x2="5" y2="16.5"/>
      <line x1="19" y1="7.5" x2="19" y2="16.5"/>
    </svg>
  ),

  crystal: ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l4 6h4l-6 8-2 6-2-6-6-8h4z"/>
      <path d="M8 8h8"/>
    </svg>
  ),

  pain: ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="12" rx="10" ry="6"/>
      <path d="M2 12c0 0 4 4 10 4s10-4 10-4"/>
      <path d="M6 9c1 1 2 2 6 2s5-1 6-2"/>
      <circle cx="9" cy="10" r="1" fill={color}/>
      <circle cx="15" cy="10" r="1" fill={color}/>
    </svg>
  ),

  // Fallback - medical cross
  default: ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
      <path d="M9 12h6M12 9v6"/>
    </svg>
  ),

  // Stethoscope for home/login
  stethoscope: ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
      <circle cx="20" cy="10" r="2"/>
    </svg>
  ),

  // Pill for medications
  pill: ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12.5"/>
      <path d="M8 16l2-4 3 6 2-3 2 3"/>
      <path d="M17 20a3 3 0 1 1 6 0 3 3 0 0 1-6 0"/>
      <path d="M20 17v6"/>
      <path d="M17 20h6"/>
    </svg>
  ),

  xray: ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2"/>
      <path d="M9 8h6"/>
      <path d="M12 8v3"/>
      <path d="M8 11h8"/>
      <path d="M9 14l-1 3"/>
      <path d="M15 14l1 3"/>
      <path d="M9 14h6"/>
    </svg>
  ),

  mri: ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="12" r="5"/>
      <circle cx="12" cy="12" r="1"/>
      <line x1="3" y1="12" x2="7" y2="12"/>
      <line x1="17" y1="12" x2="21" y2="12"/>
      <line x1="12" y1="3" x2="12" y2="7"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
};

export const MedIcon: React.FC<MedIconProps> = ({ name, size = 24, color = 'currentColor' }) => {
  const IconComp = ICONS[name] || ICONS['default'];
  return <IconComp size={size} color={color} />;
};

// Icon in a colored rounded box, used for CAT cards
export const MedIconBox: React.FC<{ name: string; size?: number; boxSize?: number; color?: string; bg?: string }> = ({
  name, size = 22, boxSize = 46, color = '#1a6bb5', bg = '#e8f2fb',
}) => (
  <div style={{
    width: boxSize, height: boxSize,
    borderRadius: Math.round(boxSize * 0.27),
    background: bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }}>
    <MedIcon name={name} size={size} color={color} />
  </div>
);

// Category → icon name mapping
export const CAT_ICON_MAP: Record<string, { icon: string; color: string; bg: string }> = {
  bone:       { icon: 'bone',     color: '#1a6bb5', bg: '#e8f2fb' },
  spine:      { icon: 'spine',    color: '#0d5299', bg: '#dbeafe' },
  knee:       { icon: 'knee',     color: '#16a085', bg: '#e0f5f0' },
  shoulder:   { icon: 'shoulder', color: '#7c3aed', bg: '#ede9fe' },
  nerve:      { icon: 'nerve',    color: '#dc2626', bg: '#fee2e2' },
  joint:      { icon: 'joint',    color: '#b45309', bg: '#fef3c7' },
  joints:     { icon: 'joints',   color: '#6d28d9', bg: '#ede9fe' },
  crystal:    { icon: 'crystal',  color: '#0891b2', bg: '#e0f2fe' },
  pain:       { icon: 'pain',     color: '#64748b', bg: '#f1f5f9' },
  default:    { icon: 'default',  color: '#1a6bb5', bg: '#e8f2fb' },
};

export default MedIcon;
