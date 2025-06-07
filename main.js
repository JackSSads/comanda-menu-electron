import { app, BrowserWindow, Notification } from "electron";
import { io } from "socket.io-client";
import { config } from "dotenv";
import CustomPrinter from "./print.js";

config();

const socket = io("", {
    withCredentials: true,
    transports: ["websocket"],
});

socket.on("connect", () => {
    console.log("Connected to server");
});

socket.on("disconnect", (reason) => {
    console.log(`Disconnected from server: ${reason}`);
});

socket.on("print_check", (data) => {
    const print = new CustomPrinter(data.printer_name);
    print.closeCheck(data)
        .catch((error) => {
            showNotification("Ocorreu um erro ao tentar imprimir!", error.message);
        });
});

socket.on("new_order", (data) => {
    if (!data.printer_name) return;

    const print = new CustomPrinter(data.printer_name);
    print.newOrder(data)
        .catch((error) => {
            showNotification("Ocorreu um erro ao tentar imprimir!", error.message);
        });
});

function showNotification(title, body) {
    new Notification({ title, body }).show();
};

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true
    });

    win.loadURL("");
};

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
