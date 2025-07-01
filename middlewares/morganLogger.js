import chalk from 'chalk';
import morgan from 'morgan';
import fs from "fs";
import path from 'path';

const getTodayDate = () =>{
    const date = new Date();
    return date.toLocaleDateString('he-US',{
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\./g, '-');
};

const getTodayTime = () =>{
    const date = new Date();
    return date.toLocaleTimeString('he-US',{
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

const logsDir = path.join(process.cwd(), 'logs');

if(!fs.existsSync(logsDir)){
    fs.mkdirSync(logsDir);
}

const accessLogStream = fs.createWriteStream(path.join(logsDir,`${getTodayDate()}.txt`),{flags:'a'});


const consoleFormat = (tokens, req, res) =>{
    const color =res.statusCode >= 400 ? chalk.red : chalk.green;

    return[
        chalk.cyan(getTodayDate()),
        chalk.cyan(getTodayTime()),
        color(tokens.method(req, res)),
        color(tokens.url(req, res)),
        color(tokens.status(req, res)),
        tokens['response-time'](req, res) + 'ms',
    ].join(' | ');
};

const fileFormat = (tokens, req, res) =>{
    return + res.statusCode <400 ?"":
    [
        getTodayDate(),
        getTodayTime(),
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens['response-time'](req, res) + 'ms',
    ].join(' | ');
};

const consoleLogger = morgan(consoleFormat);

const fileLogger = morgan(fileFormat, {
    stream: accessLogStream
});


export const morganLogger = (req, res, next) => {
    consoleLogger(req, res, (err)=>{
        if (err) return next(err);
        fileLogger(req, res, next);
    });
};

