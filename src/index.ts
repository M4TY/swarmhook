import * as child_process from "child_process";
import express from "express";
import {parse} from 'yaml'
import fs from "fs";
import dotenv from "dotenv";
import {notify, NotificationType} from "./utils/notifier";
import {Config} from "./types";
import redeploy from "./handlers/redeploy";

export let config: Config;

const main = () => {
    dotenv.config();
    const app = express();
    const port = process.env.PORT || 3000;
    config = loadConfig();


    for (const service of Object.keys(config.webhooks.services)) {
        notify(service, NotificationType.success);
    }

    app.use(express.json());

    app.get("/", (req, res) => {
        res.status(200).send("");
    });

    app.post("/webhooks/:serviceName", redeploy(config));

    app.listen(port, () => {
        console.log(`Server listening for webhooks on ${port}`);
    });
}

const loadConfig = (): Config => {
    try {
        const file = fs.readFileSync('./config.yml', 'utf8')
        return parse(file);
    } catch (e) {
        process.exit(1)
    }
}

main();