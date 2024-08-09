#!/usr/bin/env zx

export function header_1(txt){
    return chalk.bgGreen.black.bold.inverse(txt)
}

export function header_2(txt){
    return chalk.bgBlack.cyan.bold.italic(txt)
}

export function body_1(txt){
    return chalk.bgBlack.bold.cyan(txt)
}
export function body_sec(txt){
    return chalk.dim.italic(txt)
}

export function body_2(txt){
    return chalk.black(txt)
}
export function body_2_line(txt){
    return chalk.black.underline(txt)
}
export function body_2_bold(txt){
    return chalk.black.bold(txt)
}

export function keyWord(txt){
    return chalk.italic.underline(txt)
}

export function bodyBold(txt){
    return chalk.bold(txt)
}