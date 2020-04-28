import React from "react";

import { ThemeMode, useTheme } from "@/styles";

import { CustomIcon } from "./CustomIcon";

import invertedSlippiLogoSVG from "@/styles/images/slippi-logo-invert.svg";
import slippiLogoSVG from "@/styles/images/slippi-logo.svg";

export const SlippiIcon: React.FC<any> = props => {
    const { themeName } = useTheme();
    if (themeName === ThemeMode.LIGHT) {
        return (<CustomIcon image={invertedSlippiLogoSVG} {...props} />);
    }
    return (
        <CustomIcon image={slippiLogoSVG} {...props} />
    );
};
