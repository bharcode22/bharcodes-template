import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  accentColor?: string;
}

export const HardwareChipIcon: React.FC<IconProps> = ({
  size = 56,
  color = '#1D1D1F',
  accentColor = '#34C759',
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {/* Top & Bottom Pins */}
    <path
      d="M20 8V14M32 8V14M44 8V14M20 50V56M32 50V56M44 50V56"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.7"
    />
    {/* Left & Right Pins */}
    <path
      d="M8 20H14M8 32H14M8 44H14M50 20H56M50 32H56M50 44H56"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.7"
    />
    {/* Outer Chip Body */}
    <rect
      x="14"
      y="14"
      width="36"
      height="36"
      rx="8"
      stroke={color}
      strokeWidth="3"
    />
    {/* Inner Die */}
    <rect
      x="23"
      y="23"
      width="18"
      height="18"
      rx="4"
      fill={accentColor}
      fillOpacity="0.2"
      stroke={accentColor}
      strokeWidth="2.5"
    />
    {/* Center Status Core */}
    <circle cx="32" cy="32" r="3.5" fill={accentColor} />
  </svg>
);

export const MqttIcon: React.FC<IconProps> = ({
  size = 56,
  color = '#0071E3',
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {/* Outer rounded frame */}
    <rect
      x="8"
      y="8"
      width="48"
      height="48"
      rx="14"
      stroke={color}
      strokeWidth="3"
    />
    {/* Three concentric broadcast arcs representing MQTT Pub/Sub */}
    <circle cx="20" cy="44" r="4" fill={color} />
    <path
      d="M20 33C26.075 33 31 37.925 31 44"
      stroke={color}
      strokeWidth="3.2"
      strokeLinecap="round"
    />
    <path
      d="M20 24C31.046 24 40 32.954 40 44"
      stroke={color}
      strokeWidth="3.2"
      strokeLinecap="round"
    />
    <path
      d="M20 15C36.016 15 49 27.984 49 44"
      stroke={color}
      strokeWidth="3.2"
      strokeLinecap="round"
      opacity="0.75"
    />
  </svg>
);

export const NodeJsIcon: React.FC<IconProps> = ({
  size = 56,
  color = '#34C759',
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {/* Hexagon */}
    <path
      d="M32 6L54.5 19V45L32 58L9.5 45V19L32 6Z"
      fill={color}
      fillOpacity="0.14"
      stroke={color}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    {/* Stylized inner N / server node */}
    <path
      d="M24 41V23L40 41V23"
      stroke={color}
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const WebSocketIcon: React.FC<
  IconProps & { shift?: number }
> = ({ size = 56, color = '#0071E3', accentColor = '#34C759', shift = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {/* Top right arrow */}
    <g style={{ transform: `translateX(${shift}px)` }}>
      <path
        d="M12 23H50M50 23L40 13M50 23L40 33"
        stroke={color}
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    {/* Bottom left arrow */}
    <g style={{ transform: `translateX(${-shift}px)` }}>
      <path
        d="M52 41H14M14 41L24 31M14 41L24 51"
        stroke={accentColor}
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

export const ReactIcon: React.FC<
  IconProps & { rotationDeg?: number }
> = ({ size = 56, color = '#0EA5E9', rotationDeg = 0 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    style={{ transform: `rotate(${rotationDeg}deg)` }}
  >
    <circle cx="32" cy="32" r="5" fill={color} />
    <ellipse
      cx="32"
      cy="32"
      rx="24"
      ry="9.5"
      stroke={color}
      strokeWidth="2.8"
    />
    <ellipse
      cx="32"
      cy="32"
      rx="24"
      ry="9.5"
      stroke={color}
      strokeWidth="2.8"
      transform="rotate(60 32 32)"
    />
    <ellipse
      cx="32"
      cy="32"
      rx="24"
      ry="9.5"
      stroke={color}
      strokeWidth="2.8"
      transform="rotate(120 32 32)"
    />
  </svg>
);

export const SensorModuleIcon: React.FC<IconProps> = ({
  size = 56,
  color = '#1D1D1F',
  accentColor = '#34C759',
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {/* Outer signal waves */}
    <path
      d="M15 22C10.5 27.5 10.5 36.5 15 42M49 22C53.5 27.5 53.5 36.5 49 42"
      stroke={accentColor}
      strokeWidth="3.2"
      strokeLinecap="round"
      opacity="0.85"
    />
    <path
      d="M21 26C18.5 29.5 18.5 34.5 21 38M43 26C45.5 29.5 45.5 34.5 43 38"
      stroke={accentColor}
      strokeWidth="3.2"
      strokeLinecap="round"
    />
    {/* Sensor probe body */}
    <rect
      x="26"
      y="16"
      width="12"
      height="32"
      rx="6"
      stroke={color}
      strokeWidth="3.2"
    />
    <circle cx="32" cy="39" r="3.5" fill={accentColor} />
    <path
      d="M32 24V34"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

export const GatewayRouterIcon: React.FC<IconProps> = ({
  size = 56,
  color = '#1D1D1F',
  accentColor = '#0071E3',
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {/* Dual antennas */}
    <path
      d="M21 32V15M43 32V15"
      stroke={color}
      strokeWidth="3.2"
      strokeLinecap="round"
    />
    <circle cx="21" cy="14" r="3" fill={accentColor} />
    <circle cx="43" cy="14" r="3" fill={accentColor} />
    {/* Router chassis */}
    <rect
      x="11"
      y="32"
      width="42"
      height="18"
      rx="6"
      stroke={color}
      strokeWidth="3.2"
    />
    {/* Status LEDs */}
    <circle cx="21" cy="41" r="2.8" fill={accentColor} />
    <circle cx="30" cy="41" r="2.8" fill={accentColor} opacity="0.65" />
    <path
      d="M38 41H45"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
);

export const IndustrialBoardIcon: React.FC<IconProps> = ({
  size = 56,
  color = '#1D1D1F',
  accentColor = '#34C759',
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {/* PCB outer frame */}
    <rect
      x="10"
      y="14"
      width="44"
      height="36"
      rx="7"
      stroke={color}
      strokeWidth="3.2"
    />
    {/* Traces */}
    <path
      d="M18 24H28L33 29H46M18 40H26L31 35H46"
      stroke={color}
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.75"
    />
    {/* Solder nodes */}
    <circle cx="18" cy="24" r="2.6" fill={accentColor} />
    <circle cx="18" cy="40" r="2.6" fill={accentColor} />
    <rect
      x="38"
      y="25"
      width="9"
      height="14"
      rx="2.5"
      fill={accentColor}
      fillOpacity="0.22"
      stroke={accentColor}
      strokeWidth="2.4"
    />
  </svg>
);

export const SmartMeterIcon: React.FC<IconProps> = ({
  size = 56,
  color = '#1D1D1F',
  accentColor = '#34C759',
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {/* Device casing */}
    <rect
      x="13"
      y="11"
      width="38"
      height="42"
      rx="9"
      stroke={color}
      strokeWidth="3.2"
    />
    {/* Gauge arc */}
    <path
      d="M22 33C22 27.477 26.477 23 32 23C37.523 23 42 27.477 42 33"
      stroke={accentColor}
      strokeWidth="3.2"
      strokeLinecap="round"
    />
    {/* Needle */}
    <path
      d="M32 33L38 26"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
    <circle cx="32" cy="33" r="3" fill={accentColor} />
    {/* Bottom port bar */}
    <path
      d="M24 43H40"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.65"
    />
  </svg>
);

export const CodeBracketIcon: React.FC<IconProps> = ({
  size = 56,
  color = '#0071E3',
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <path
      d="M22 20L10 32L22 44M42 20L54 32L42 44"
      stroke={color}
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M36 14L28 50"
      stroke={color}
      strokeWidth="3.2"
      strokeLinecap="round"
      opacity="0.8"
    />
  </svg>
);

export const DesignPaletteIcon: React.FC<IconProps> = ({
  size = 56,
  color = '#FF2D55',
  accentColor = '#AF52DE',
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <path
      d="M32 10C19.85 10 10 19.85 10 32C10 44.15 19.85 54 32 54C34.2 54 36 52.2 36 50C36 48.98 35.6 48.06 34.96 47.38C34.34 46.72 34 45.86 34 44.9C34 42.7 35.8 40.9 38 40.9H44C50.6 40.9 56 35.5 56 28.9C56 18.5 45.2 10 32 10Z"
      stroke={color}
      strokeWidth="3.2"
      strokeLinejoin="round"
    />
    <circle cx="22" cy="24" r="3.2" fill={accentColor} />
    <circle cx="32" cy="20" r="3.2" fill={color} />
    <circle cx="42" cy="24" r="3.2" fill="#34C759" />
    <circle cx="45" cy="34" r="3.2" fill="#FF9500" />
  </svg>
);

export const BrainMindIcon: React.FC<IconProps> = ({
  size = 56,
  color = '#AF52DE',
  accentColor = '#0071E3',
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <path
      d="M32 16V48M32 24C28 18 20 18 16 23C12 28 13 35 18 38C14 42 16 48 22 48C26 48 30 44 32 40M32 24C36 18 44 18 48 23C52 28 51 35 46 38C50 42 48 48 42 48C38 48 34 44 32 40"
      stroke={color}
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="24" cy="30" r="2.5" fill={accentColor} />
    <circle cx="40" cy="30" r="2.5" fill={accentColor} />
  </svg>
);

export const SparklesAiIcon: React.FC<IconProps> = ({
  size = 56,
  color = '#FF9500',
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <path
      d="M32 10C32 21 41 30 52 32C41 34 32 43 32 54C32 43 23 34 12 32C23 30 32 21 32 10Z"
      fill={color}
      fillOpacity="0.16"
      stroke={color}
      strokeWidth="3.2"
      strokeLinejoin="round"
    />
    <path
      d="M48 12C48 16.5 51.5 20 56 20C51.5 20 48 23.5 48 28C48 23.5 44.5 20 40 20C44.5 20 48 16.5 48 12Z"
      stroke={color}
      strokeWidth="2.4"
      strokeLinejoin="round"
    />
  </svg>
);


