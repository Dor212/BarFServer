import { connect } from "mongoose";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();
const db = process.env.ENV === "dev" ? process.env.MONGO_LOCAL : process.env.MONGO_ATLAS;
const name = db === process.env.MONGO_LOCAL? "local":"atals"


export const conn = async () => {
    try {
        await connect(db);
        console.log(chalk.magenta("Connected To MongoDB"+ " "+name));
    } catch (err) {
        console.log(err);
    }
}