import { app, BrowserWindow, Notification } from "electron";
import { io } from "socket.io-client";
import CustomPrinter from "./print.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const socket = io("http://localhost:3001", {
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
    new CustomPrinter(data.printer_name)
        .closeCheck(data)
        .catch(() => {
            showNotification("Ocorreu um erro ao tentar imprimir!");
        });
});

socket.on("new_order", (data) => {
    const printers = data.printer_name || [];

    if (!printers.length) return;

    printers.forEach((printer) => {
        new CustomPrinter(printer)
            .newOrder(data)
            .catch((error) => {
                showNotification("Ocorreu um erro ao tentar imprimir!", error.message);
            });
    });
});

socket.on("quantity_change", (data) => {
    const printers = data.printer_name || [];

    if (!printers.length) return;

    printers.forEach((printer) => {
        new CustomPrinter(printer)
            .printQuantityChange(data)
            .catch((error) => {
                showNotification("Ocorreu um erro ao tentar imprimir!", error.message);
            });
    });
});

socket.on("product_removed", (data) => {
    const printers = data.printer_name || [];

    if (!printers.length) return;

    printers.forEach((printer) => {
        new CustomPrinter(printer)
            .printProductRemoved(data)
            .catch((error) => {
                showNotification("Ocorreu um erro ao tentar imprimir!", error.message);
            });
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
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'assets', 'logo.ico')
    });

    win.loadURL("http://localhost:3000/login");
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
