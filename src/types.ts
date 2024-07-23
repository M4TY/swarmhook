export type Config = {
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