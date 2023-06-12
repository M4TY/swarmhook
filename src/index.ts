import * as child_process from "child_process";
import express from "express";
import {parse} from 'yaml'
import fs from "fs";
import dotenv from "dotenv";
import {notify, NotificationType} from "./utils/notifier";

type Config = {
    webhooks: {
        services: {
            [key: string]: Service
        }
    }
}

type Service = {
    token: string,
    service_name: string,
    latest: boolean
    image?: string

}

const main = () => {
    dotenv.config();
    const app = express();
    const port = process.env.PORT || 3000;
    const config = loadConfig();

    for (const service of Object.keys(config.webhooks.services)) {
        notify(service, NotificationType.success);
    }

    app.use(express.json());

    app.get("/", (req, res) => {
        res.json(config);
    });

    app.post("/webhooks/:serviceName", (req, res) => {
        const serviceName = req.params.serviceName;

        if (!config.webhooks.services[serviceName]) {
            res.status(404).send("Service not found");
            return;
        }

        const service = config.webhooks.services[serviceName];

        const token = service.token;

        if (req.headers.authorization !== `Bearer ${token}`) {
            res.status(401).send("Unauthorized");
            return;
        }

        const service_name = service.service_name;

        if (service.latest) {
            notify(`Deploying ${service_name} to latest version`, NotificationType.deploy);
            res.status(200).send("Deploying to latest version");
            exec(service, "latest");
        } else {
            const imageVersionTag = req.body.versionTag;
            if (!imageVersionTag) {
                res.status(400).send("Missing version tag for deployment. (If you want to deploy to latest, set latest to true in the config)");
                return;
            }
            notify(`Deploying ${service_name} to ${imageVersionTag}`, NotificationType.deploy);
            res.status(200).send(`Deploying to ${imageVersionTag}`);
            exec(service, imageVersionTag);
        }
    });

    app.listen(port, () => {
        console.log(`Server listening for webhooks on ${port}`);
    });
}

function exec(service: Service, version: string) {
    const service_name = service.service_name;
    if (version === "latest") {
        const command = `docker service update ${service_name} --with-registry-auth`
        child_process.exec(command, (error, stdout, stderr) => {
            if (error) {
                notify(`Error deploying ${service_name} to latest version`, NotificationType.error);
                console.log(error);
                return;
            }
            notify(`Successfully deployed ${service_name} to latest version`, NotificationType.success);
            console.log(stdout);
        });
    } else {
        const image = service.image + ":" + version;
        const command = `docker service update ${service_name} --with-registry-auth --image ${image}`
        child_process.exec(command, (error, stdout, stderr) => {
            if (error) {
                notify(`Error deploying ${service_name} to version ${version}`, NotificationType.error);
                return;
            }
            notify(`Successfully deployed ${service_name} to version ${version}`, NotificationType.success);
            console.log(stdout);
        });
    }
}

const loadConfig = (): Config => {
    try {
        const file = fs.readFileSync('./config.yml', 'utf8')
        return parse(file);
    } catch (e) {
        console.log(e);
        process.exit(1)
    }
}

main();