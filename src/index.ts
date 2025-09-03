import * as child_process from "child_process";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import { parse } from 'yaml';
import { NotificationType, notify } from "./utils/notifier";

type Config = {
    webhooks: {
        services: {
            [key: string]: Service
        }
    },
    notifications: Record<"discord" | "console", DiscordNotification[]>
}

export type DiscordNotification = {
    url: string,
    services: string[]
}

export type Service = {
    token: string,
    service_name: string,
    latest: boolean
    image?: string
}

export let config: Config;

const main = () => {
    dotenv.config();
    const app = express();
    const port = process.env.PORT || 3000;
    config = loadConfig();

    console.log(`Loaded ${Object.keys(config.webhooks.services).length} service(s)`);
    console.log(`Using ${Object.keys(config.notifications).length} notification(s) providers`);

    for (const service of Object.keys(config.webhooks.services)) {
        notify(service, NotificationType.success);
    }

    app.use(express.json());

    app.get("/", (req, res) => {
        res.status(200).send("");
    });

    app.post("/webhooks/:serviceName", (req, res) => {
        console.log("Received webhook request for " + req.params.serviceName)
        const serviceName = req.params.serviceName;

        if (!config.webhooks.services[serviceName]) {
            res.status(404).send("Service not found");
            console.log("-> Service not found: " + req.params.serviceName)
            return;
        }

        const service = config.webhooks.services[serviceName];
        const token = service.token;

        if (token && req.headers.authorization !== `Bearer ${token}`) {
            res.status(401).send("Unauthorized");
            console.log("-> Unauthorized request for " + req.params.serviceName)
            return;
        }

        if (service.latest) {
            res.status(200).send("Deploying to latest version");
            exec(service, "latest");
        } else {
            const imageVersionTag = req.body.versionTag;
            if (!imageVersionTag) {
                res.status(400).send("Missing version tag for deployment. (If you want to deploy to latest, set latest to true in the config)");
                console.log("-> Missing tag for " + req.params.serviceName)
                return;
            }
            res.status(200).send(`Deploying to ${imageVersionTag}`);
            exec(service, imageVersionTag);
        }
    });

    app.listen(port, () => {
        console.log(`Server listening for webhooks on port ${port}`);
    });
}

function exec(service: Service, version: string) {
    child_process.exec(`docker login ${process.env.PRIVATE_REGISTRY_URL ?? ""} -u ${process.env.DOCKER_USERNAME} -p ${process.env.DOCKER_PASSWORD}`, (error, stdout, stderr) => {
        if (error) {
            notify(`Error logging into docker registry`, NotificationType.error);
            console.log(error);
            return;
        }

        const service_name = service.service_name;
        const image = service.image + ":" + version;
        const command = `docker service update ${service_name} --with-registry-auth --image ${image}`
        child_process.exec(command,
            (error, stdout, stderr) => {
                if (error) {
                    notify(`Failed to deploy ${service_name} to version ${version}`, NotificationType.error, service);
                    console.log(error);
                    return;
                }
                notify(`Successfully deployed ${service_name} to version ${version}`, NotificationType.success, service);
            });

        console.log("-> Finished request " + service_name)
    });
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
