import * as React from "react";
import Svg, { Path } from "react-native-svg";

export default function HomeIcon({ size = 24, color = "green" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 24" fill="none">
      <Path
        d="M2 9L11 2L20 9V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H4C3.46957 22 2.96086 21.7893 2.58579 21.4142C2.21071 21.0391 2 20.5304 2 20V9Z"
        fill={color}
      />
      <Path
        d="M8 22V12H14V22M2 9L11 2L20 9V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H4C3.46957 22 2.96086 21.7893 2.58579 21.4142C2.21071 21.0391 2 20.5304 2 20V9Z"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
