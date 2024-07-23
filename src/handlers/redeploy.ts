import {Config} from "../types";
import {Request, Response} from "express";
import {exec} from "../utils/exec";

function redeploy(config: Config) {
    return (req: Request, res: Response) => {
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
            res.status(200).send("Deploying to latest version");
            exec(service, "latest");
        } else {
            const imageVersionTag = req.body.versionTag;
            if (!imageVersionTag) {
                res.status(400).send("Missing version tag for deployment. (If you want to deploy to latest, set latest to true in the config)");
                return;
            }
            res.status(200).send(`Deploying to ${imageVersionTag}`);
            exec(service, imageVersionTag);
        }
    }
}
export default redeploy;