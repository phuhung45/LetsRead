import * as React from "react";
import Svg, { Path } from "react-native-svg";

export default function FacebookIcon({ size = 24, color = "black" }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M12 2.04C6.48 2.04 2 6.52 2 12.04C2 17.06 5.66 21.17 10.44 21.95V14.89H7.9V12.04H10.44V9.79C10.44 7.27 11.93 5.89 14.21 5.89C15.3 5.89 16.45 6.09 16.45 6.09V8.55H15.19C13.95 8.55 13.56 9.32 13.56 10.11V12.04H16.33L15.89 14.89H13.56V21.95C18.34 21.17 22 17.06 22 12.04C22 6.52 17.52 2.04 12 2.04Z"
        fill={color}
      />
    </Svg>
  );
}
