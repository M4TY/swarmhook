enum NotificationType {
    "deploy",
    "success",
    "error"
}

const notificationMapping: {[key in NotificationType]: string} = {
    0: "🚀  |",
    1: "✅  |",
    2: "❌  |"
}

const notify = (message: string, type: NotificationType) => {
    console.log(`${notificationMapping[type]} ${message}`);
}

export {notify, NotificationType};