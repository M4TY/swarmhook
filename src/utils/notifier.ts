import { config, DiscordNotification, Service } from "../index";

enum NotificationType {
    "deploy",
    "success",
    "error"
}

const notificationMapping: { [key in NotificationType]: string } = {
    0: "🚀  |",
    1: "✅  |",
    2: "❌  |"
}

const notifyConsole = (message: string, type: NotificationType) => {
    console.log(`${notificationMapping[type]} ${message}`);
}

const notifyDiscord = (message: string, type: NotificationType, hook: DiscordNotification) => {
    const params = {
        username: "Swarmhook",
        avatar_url: "",
        content: "",
        embeds: [
            {
                "title": message,
                "color": type === NotificationType.error ? 10038562 : 2067276,
                "thumbnail": {
                    "url": "",
                },
                "fields": [
                    {
                        "name": "",
                        "value": "",
                        "inline": true
                    }
                ]
            }
        ]
    }
    fetch((hook.url), {
        method: "POST",
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(params)
    })
}

const notify = (message: string, type: NotificationType, service?: Service) => {
    const m = notificationMapping[type] + " " + message;

    if (config.notifications.console) {
        notifyConsole(m, type);
    } else if (config.notifications.discord) {
        if (!service) return;
        const rules = config.notifications.discord;
        const hooks = rules.filter(hook =>
            hook.services.includes(service.service_name) || hook.services.includes("ALL")
        );

        if (type === NotificationType.success && !hooks) return;

        hooks.forEach(hook => {
            notifyDiscord(m, type, hook);
        })
    }
}

export { NotificationType, notify };
