import {Service} from "../types";
import child_process from "child_process";
import {NotificationType, notify} from "./notifier";

export function exec(service: Service, version: string) {
    child_process.exec(`docker login -u ${process.env.DOCKER_USERNAME} -p ${process.env.DOCKER_PASSWORD}`, (error, stdout, stderr) => {
        if (error) {
            notify(`Error logging into docker registry`, NotificationType.error);
            return;
        }

        const service_name = service.service_name;
        if (version === "latest") {
            const command = `docker service update ${service_name} --with-registry-auth`
            child_process.exec(command, (error, stdout, stderr) => {
                if (error) {
                    notify(`Error deploying ${service_name} to latest version`, NotificationType.error, service);
                    return;
                }
                notify(`Successfully deployed ${service_name} to latest version`, NotificationType.deploy, service);
            });
        } else {
            const image = service.image + ":" + version;
            const command = `docker service update ${service_name} --with-registry-auth --image ${image}`
            child_process.exec(command,
                (error, stdout, stderr) => {
                    if (error) {
                        notify(`Failed to deploy ${service_name} to version ${version}`, NotificationType.error, service);
                        return;
                    }
                    notify(`Successfully deployed ${service_name} to version ${version}`, NotificationType.success, service);
                });
        }

    });
}

export default exec